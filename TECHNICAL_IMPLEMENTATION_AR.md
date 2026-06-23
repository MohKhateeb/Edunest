# 🛠️ خطة التنفيذ: البنية الفنية والكود

## القسم 1: هيكل قاعدة البيانات (تعديلات طفيفة)

### جدول Booking الحالي (تحسين)

```prisma
model Booking {
  id                    String    @id @default(cuid())
  
  // العلاقات الأساسية
  parentUserId          String
  studentId             String
  teacherServiceId      String
  
  // الوقت والمدة
  startTime             DateTime  @default(now())
  duration              Int       // بالدقائق
  
  // الحالة
  status                BookingStatus @default(CONFIRMED) // ✅ تغيير: CONFIRMED مباشرة!
  paymentStatus         PaymentStatus @default(PAID)      // ✅ تغيير: PAID مباشرة
  
  // الجلسة
  meetingUrl            String    @unique // ✅ مُولّد مسبقاً
  meetingJoinedAt       DateTime?
  sessionCompletedAt    DateTime?
  
  // السعر والعمولة
  price                 Decimal
  commissionPercentage  Int
  
  // التقرير الذكي (ذاتي التوليد)
  studentAttendance     Boolean?  @default(false)
  teacherAttendance     Boolean?  @default(false)
  performanceScore      Int?      // 1-5
  completionPercentage  Int?      // حسبة ذاتية من الوقت الفعلي
  
  // metadata
  instantBooking        Boolean   @default(true) // ✅ جديد
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // العلاقات
  parent                User      @relation("ParentBookings", fields: [parentUserId], references: [id])
  student               Student   @relation(fields: [studentId], references: [id])
  teacherService        TeacherService @relation(fields: [teacherServiceId], references: [id])
  
  @@index([parentUserId])
  @@index([studentId])
  @@index([teacherServiceId])
  @@index([startTime])
  @@index([status])
}

// جديد: جدول لتخزين رابط Jitsi مسبقاً
model MeetingUrlPool {
  id            String @id @default(cuid())
  teacherId     String
  url           String @unique
  isUsed        Boolean @default(false)
  createdAt     DateTime @default(now())
  expiresAt     DateTime // ينتهي بعد ساعة إذا لم يُستخدم
  
  teacher       User @relation("MeetingUrlPools", fields: [teacherId], references: [id])
  
  @@index([teacherId, isUsed])
}
```

---

## القسم 2: خدمات Backend الأساسية

### 2.1 خدمة الحجز الفوري (lib/actions/bookings/instant-book.ts)

```typescript
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { broadcast } from '@/lib/services/notifications';

export interface InstantBookRequest {
  parentUserId: string;
  studentId: string;
  teacherServiceId: string;
  durationMinutes: number; // افتراضي 30 أو 60
}

export async function instantBookSession(
  data: InstantBookRequest
) {
  const { parentUserId, studentId, teacherServiceId, durationMinutes } = data;

  return await prisma.$transaction(
    async (tx) => {
      // 1️⃣ التحقق من الرصيد والخدمة متاحة
      const [parent, teacherService, student] = await Promise.all([
        tx.user.findUniqueOrThrow({
          where: { id: parentUserId },
          select: { walletBalance: true, defaultPaymentMethod: true },
        }),
        tx.teacherService.findUniqueOrThrow({
          where: { id: teacherServiceId },
          select: {
            price: true,
            isAvailableNow: true,
            teacher: { select: { id: true } },
          },
        }),
        tx.student.findUniqueOrThrow({ where: { id: studentId } }),
      ]);

      if (!teacherService.isAvailableNow) {
        throw new Error('المعلم غير متاح الآن');
      }

      const totalPrice = new Decimal(teacherService.price).mul(
        durationMinutes / 60
      );

      // 2️⃣ التحقق من الدفع
      let paymentSuccess = false;
      
      if (parent.walletBalance >= totalPrice) {
        // دفع من الرصيد
        await tx.user.update({
          where: { id: parentUserId },
          data: { walletBalance: { decrement: totalPrice } },
        });
        paymentSuccess = true;
      } else if (parent.defaultPaymentMethod) {
        // دفع من البطاقة المحفوظة (Stripe)
        const chargeResult = await chargeCard(
          parent.defaultPaymentMethod,
          Number(totalPrice) * 100 // بالفلوس
        );
        paymentSuccess = chargeResult.success;
      }

      if (!paymentSuccess) {
        throw new Error('فشل الدفع');
      }

      // 3️⃣ إنشاء Booking فوراً (CONFIRMED)
      const booking = await tx.booking.create({
        data: {
          parentUserId,
          studentId,
          teacherServiceId,
          startTime: new Date(),
          duration: durationMinutes,
          price: totalPrice,
          commissionPercentage: getCommissionRate(teacherService),
          status: 'CONFIRMED', // ✅ تأكيد فوري!
          paymentStatus: 'PAID',  // ✅ مدفوع!
          instantBooking: true,
          meetingUrl: await getAvailableMeetingUrl(
            teacherService.teacher.id
          ),
        },
      });

      // 4️⃣ إنشاء معاملة دفع
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalPrice,
          status: 'COMPLETED',
          method: parent.walletBalance >= totalPrice ? 'WALLET' : 'CARD',
          transactionId: generateTransactionId(),
        },
      });

      // 5️⃣ بث إخطار فوري للمعلم (WebSocket + Push)
      await broadcast({
        type: 'INSTANT_BOOKING_ALERT',
        recipientId: teacherService.teacher.id,
        data: {
          bookingId: booking.id,
          studentName: student.firstName + ' ' + student.lastName,
          studentLevel: student.level,
          meetingUrl: booking.meetingUrl,
          duration: durationMinutes,
          price: totalPrice,
        },
        actions: [
          {
            label: 'ادخل الجلسة الآن',
            action: 'JOIN_MEETING',
            data: { bookingId: booking.id },
          },
          {
            label: 'رفض',
            action: 'REJECT_BOOKING',
            data: { bookingId: booking.id },
          },
        ],
      });

      return booking;
    },
    {
      timeout: 5000, // أقصى 5 ثواني
    }
  );
}

// دالة مساعدة: الحصول على رابط Jitsi من Pool
async function getAvailableMeetingUrl(
  teacherId: string
): Promise<string> {
  let url = await prisma.meetingUrlPool.findFirst({
    where: {
      teacherId,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!url) {
    // إنشاء واحد جديد إذا نفد
    url = await prisma.meetingUrlPool.create({
      data: {
        teacherId,
        url: generateJitsiUrl(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // ساعة واحدة
      },
    });
  }

  // علّم كمستخدم
  await prisma.meetingUrlPool.update({
    where: { id: url.id },
    data: { isUsed: true },
  });

  return url.url;
}

function generateJitsiUrl(): string {
  const roomId = `edunest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return `https://meet.jitsi/edunest/${roomId}`;
}

function getCommissionRate(service: any): number {
  // حسب نوع الخدمة
  if (service.type === 'QUICK_HELP') return 20;
  if (service.type === 'MONTHLY') return 12;
  return 15; // افتراضي
}

function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

async function chargeCard(paymentMethodId: string, amountInCents: number) {
  // تكامل Stripe
  try {
    const charge = await stripe.charges.create({
      amount: amountInCents,
      currency: 'sar',
      customer: paymentMethodId,
    });
    return { success: true, chargeId: charge.id };
  } catch (error) {
    return { success: false, error };
  }
}
```

### 2.2 خدمة "متاح الآن" (lib/actions/teacher/set-available-now.ts)

```typescript
export async function setTeacherAvailableNow(
  teacherId: string,
  duration: number // بالدقائق
) {
  return await prisma.$transaction(async (tx) => {
    // 1️⃣ تحديث حالة الخدمة
    const services = await tx.teacherService.updateMany({
      where: { teacherId },
      data: {
        isAvailableNow: true,
        availableUntil: new Date(Date.now() + duration * 60 * 1000),
      },
    });

    // 2️⃣ إنشاء pool من روابط Jitsi مسبقاً (10 روابط)
    const urlsToCreate = Array.from({ length: 10 }).map(() => ({
      teacherId,
      url: generateJitsiUrl(),
      isUsed: false,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    }));

    await tx.meetingUrlPool.createMany({ data: urlsToCreate });

    // 3️⃣ بث إشعار: "المعلم الآن متاح" للطلاب المتصلين
    await notifyAvailableTeachers();

    return { success: true, services };
  });
}

async function notifyAvailableTeachers() {
  // بث عام أن معلم جديد متاح الآن
  await broadcast({
    type: 'TEACHER_NOW_AVAILABLE',
    channel: 'public',
    // جميع الطلاب المتصلين سيرون المعلم الجديد في قائمة "متاحون الآن"
  });
}
```

### 2.3 معالجة رفض المعلم (lib/actions/bookings/reject.ts)

```typescript
export async function rejectInstantBooking(
  teacherId: string,
  bookingId: string
) {
  return await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });

    // 1️⃣ التحقق من أن المعلم صاحب الحجز
    const service = await tx.teacherService.findFirst({
      where: {
        id: booking.teacherServiceId,
        teacherId,
      },
    });

    if (!service) throw new Error('غير مصرح');

    // 2️⃣ إلغاء الحجز
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    // 3️⃣ استرجاع المبلغ فوراً
    await tx.user.update({
      where: { id: booking.parentUserId },
      data: { walletBalance: { increment: booking.price } },
    });

    // 4️⃣ إنشاء طلب عرض بديل للطالب
    const alternativeTeachers = await tx.teacherService.findMany({
      where: {
        isAvailableNow: true,
        id: { not: booking.teacherServiceId },
      },
      take: 3,
    });

    // 5️⃣ إرسال إخطار للطالب
    await broadcast({
      type: 'BOOKING_REJECTED',
      recipientId: booking.parentUserId,
      data: {
        bookingId,
        message: 'آسفاً، المعلم لم يتمكن من قبول الطلب',
        alternatives: alternativeTeachers,
        refundAmount: booking.price,
      },
    });

    return { success: true, refunded: booking.price };
  });
}
```

---

## القسم 3: الواجهات (Frontend Components)

### 3.1 شاشة المعلم - الصفحة الرئيسية الجديدة

**app/dashboard/teacher/instant-bookings/page.tsx**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { InstantBookingCard } from './components/InstantBookingCard';
import { SetAvailableModal } from './components/SetAvailableModal';

interface InstantBooking {
  id: string;
  studentName: string;
  studentLevel: string;
  subject: string;
  duration: number;
  meetingUrl: string;
  status: 'NEW' | 'ACCEPTED' | 'REJECTED';
}

export default function TeacherInstantBookings() {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<InstantBooking[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [availableUntil, setAvailableUntil] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // الاستماع لـ WebSocket notifications
  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/teacher/${session?.user?.id}`
    );

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'INSTANT_BOOKING_ALERT') {
        // إضافة الحجز الجديد إلى قمة القائمة
        setBookings((prev) => [
          {
            id: message.data.bookingId,
            studentName: message.data.studentName,
            studentLevel: message.data.studentLevel,
            subject: message.data.subject,
            duration: message.data.duration,
            meetingUrl: message.data.meetingUrl,
            status: 'NEW',
          },
          ...prev,
        ]);

        // تشغيل صوت إخطار
        playNotificationSound();
      }
    };

    return () => ws.close();
  }, [session?.user?.id]);

  const handleSetAvailable = async (durationMinutes: number) => {
    setLoading(true);
    const response = await fetch('/api/teacher/set-available-now', {
      method: 'POST',
      body: JSON.stringify({ durationMinutes }),
    });

    if (response.ok) {
      setIsAvailable(true);
      setAvailableUntil(
        new Date(Date.now() + durationMinutes * 60 * 1000)
      );
      setShowModal(false);
    }
    setLoading(false);
  };

  const handleAcceptBooking = (bookingId: string, meetingUrl: string) => {
    // الدخول المباشر إلى Jitsi
    window.open(meetingUrl, '_blank');

    // تحديث حالة الحجز
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'ACCEPTED' } : b
      )
    );
  };

  const handleRejectBooking = async (bookingId: string) => {
    const response = await fetch('/api/bookings/reject', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    });

    if (response.ok) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: 'REJECTED' } : b
        )
      );
    }
  };

  if (loading) {
    return <div className="p-4">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* الجزء العلوي: زر "متاح الآن" الضخم */}
      {!isAvailable ? (
        <div className="mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-lg shadow-lg"
          >
            🟢 متاح الآن
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-800 font-bold">متاح الآن</p>
              <p className="text-sm text-green-700">
                وقت الانتهاء:{' '}
                {availableUntil?.toLocaleTimeString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <button
              onClick={() => setIsAvailable(false)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              إيقاف
            </button>
          </div>
        </div>
      )}

      {/* الطلبات الفورية */}
      <div>
        <h2 className="text-2xl font-bold mb-4">الطلبات الفورية ({bookings.length})</h2>

        {bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            لا توجد طلبات جديدة. جهّز نفسك للطلاب القادمين! ⏳
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <InstantBookingCard
                key={booking.id}
                booking={booking}
                onAccept={() => handleAcceptBooking(booking.id, booking.meetingUrl)}
                onReject={() => handleRejectBooking(booking.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal: تحديد وقت التوفر */}
      {showModal && (
        <SetAvailableModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSetAvailable}
        />
      )}
    </div>
  );
}

function playNotificationSound() {
  const audio = new Audio('/sounds/notification.mp3');
  audio.play().catch(() => console.log('صوت الإخطار لم ينجح'));
}
```

### 3.2 شاشة البحث - تحسين جذري

**app/dashboard/parent/instant-search/page.tsx**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import TeacherCard from './components/TeacherCard';
import BookingConfirmModal from './components/BookingConfirmModal';

interface AvailableTeacher {
  id: string;
  name: string;
  rating: number;
  pricePerHour: number;
  subject: string;
  availableDuration: number; // بالدقائق
  profileImage: string;
}

export default function InstantSearch() {
  const { data: session } = useSession();
  const [teachers, setTeachers] = useState<AvailableTeacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<AvailableTeacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    fetchAvailableTeachers();
    
    // الاستماع لـ WebSocket لتحديث القائمة فوراً
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/available-teachers`
    );

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'TEACHER_STATUS_CHANGED') {
        fetchAvailableTeachers();
      }
    };

    return () => ws.close();
  }, [subject, level]);

  const fetchAvailableTeachers = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      subject,
      level,
      availableNow: 'true',
    });

    const response = await fetch(`/api/teachers/available?${params}`);
    const data = await response.json();
    setTeachers(data);
    setLoading(false);
  };

  const handleBookTeacher = (teacher: AvailableTeacher) => {
    setSelectedTeacher(teacher);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* فلاتر سريعة */}
      <div className="mb-6 space-y-4">
        <h1 className="text-3xl font-bold">ابحث عن معلم متاح الآن</h1>

        <div className="flex gap-3 flex-wrap">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">كل المواد</option>
            <option value="math">الرياضيات</option>
            <option value="english">اللغة الإنجليزية</option>
            <option value="arabic">اللغة العربية</option>
          </select>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">كل المستويات</option>
            <option value="primary">ابتدائي</option>
            <option value="middle">متوسط</option>
            <option value="high">ثانوي</option>
          </select>

          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="px-4 py-2 border rounded-lg"
          >
            <option value={30}>30 دقيقة</option>
            <option value={60}>ساعة واحدة</option>
            <option value={90}>ساعة ونصف</option>
          </select>
        </div>
      </div>

      {/* نتائج البحث */}
      {loading ? (
        <div className="text-center py-8">جاري البحث...</div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          لا توجد معلمين متاحين الآن. حاول لاحقاً! 📍
        </div>
      ) : (
        <div className="grid gap-4">
          <h2 className="text-xl font-bold">متاحون الآن ({teachers.length})</h2>
          {teachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              duration={duration}
              onBook={() => handleBookTeacher(teacher)}
            />
          ))}
        </div>
      )}

      {/* Modal: تأكيد الحجز */}
      {selectedTeacher && (
        <BookingConfirmModal
          teacher={selectedTeacher}
          duration={duration}
          onConfirm={async () => {
            // إنشاء الحجز الفوري
            const response = await fetch('/api/bookings/instant-book', {
              method: 'POST',
              body: JSON.stringify({
                teacherServiceId: selectedTeacher.id,
                durationMinutes: duration,
              }),
            });

            if (response.ok) {
              const booking = await response.json();
              // إعادة توجيه إلى شاشة الانتظار/الجلسة
              window.location.href = `/booking/${booking.id}/waiting`;
            }
          }}
          onClose={() => setSelectedTeacher(null)}
        />
      )}
    </div>
  );
}
```

### 3.3 بطاقة الحجز الفوري للمعلم

**components/teacher/InstantBookingCard.tsx**

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';

interface InstantBookingCardProps {
  booking: {
    id: string;
    studentName: string;
    studentLevel: string;
    subject: string;
    duration: number;
    status: 'NEW' | 'ACCEPTED' | 'REJECTED';
  };
  onAccept: () => void;
  onReject: () => void;
}

export function InstantBookingCard({
  booking,
  onAccept,
  onReject,
}: InstantBookingCardProps) {
  const statusColors = {
    NEW: 'bg-red-100 border-red-300',
    ACCEPTED: 'bg-green-100 border-green-300',
    REJECTED: 'bg-gray-100 border-gray-300',
  };

  const statusLabels = {
    NEW: '🔴 جديد!',
    ACCEPTED: '✅ موافق عليه',
    REJECTED: '❌ مرفوض',
  };

  return (
    <div
      className={`p-4 border-2 rounded-lg shadow-md ${statusColors[booking.status]}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold">{booking.studentName}</h3>
          <p className="text-sm text-gray-600">
            {booking.subject} | {booking.studentLevel}
          </p>
        </div>
        <span className="text-sm font-semibold">{statusLabels[booking.status]}</span>
      </div>

      <p className="text-gray-700 mb-4">
        ⏱️ المدة: {booking.duration} دقيقة
      </p>

      {booking.status === 'NEW' && (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg"
          >
            📹 ادخل الجلسة الآن
          </button>
          <button
            onClick={onReject}
            className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg"
          >
            رفض
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## القسم 4: APIs الجديدة

### 4.1 API: الحجز الفوري

**app/api/bookings/instant-book/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { instantBookSession } from '@/lib/actions/bookings/instant-book';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession({ req: request });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();

    const booking = await instantBookSession({
      parentUserId: session.user.id,
      studentId: body.studentId,
      teacherServiceId: body.teacherServiceId,
      durationMinutes: body.durationMinutes || 30,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

### 4.2 API: جلب المعلمين المتاحين

**app/api/teachers/available/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subject = searchParams.get('subject');
    const level = searchParams.get('level');

    const teachers = await prisma.teacherService.findMany({
      where: {
        isAvailableNow: true,
        teacher: {
          isActive: true,
          isVerified: true,
        },
        ...(subject && { subject }),
        ...(level && { level }),
      },
      select: {
        id: true,
        price: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        rating: true,
      },
      take: 10, // حد أقصى 10 نتائج
    });

    const formatted = teachers.map((t) => ({
      id: t.id,
      name: `${t.teacher.firstName} ${t.teacher.lastName}`,
      rating: t.rating || 4.5,
      pricePerHour: Number(t.price),
      profileImage: t.teacher.image,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## القسم 5: Middleware للتوثيق السريع

### 5.1 WebSocket Handler

**lib/websocket/booking-handler.ts**

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { verifyAuth } from '@/lib/auth';

export function setupBookingSocketHandlers(io: SocketIOServer) {
  io.on('connection', async (socket) => {
    try {
      const token = socket.handshake.auth.token;
      const user = await verifyAuth(token);

      if (!user) {
        socket.disconnect();
        return;
      }

      // انضم المستخدم إلى قناة خاصة به
      socket.join(`user-${user.id}`);

      // إذا كان معلماً، انضم إلى قناة المعلمين
      if (user.role === 'TEACHER') {
        socket.join('available-teachers');
      }

      // استقبال: المعلم يعلن توفره
      socket.on('teacher:set-available', async (data) => {
        // بث للطلاب: معلم جديد متاح
        io.emit('teacher:now-available', {
          teacherId: user.id,
          duration: data.durationMinutes,
        });
      });

      // استقبال: الطالب يحجز
      socket.on('booking:instant', async (data) => {
        // إخطار فوري للمعلم
        io.to(`user-${data.teacherId}`).emit('booking:new-instant', data);
      });

      socket.on('disconnect', () => {
        // المعلم غير متصل = غير متاح
        io.emit('teacher:unavailable', { teacherId: user.id });
      });
    } catch (error) {
      socket.disconnect();
    }
  });
}
```

---

## خلاصة الملفات المطلوبة

```
✅ تعديلات قاعدة البيانات:
  └─ Booking model: إضافة instantBooking و meetingUrl
  └─ MeetingUrlPool: جديد

✅ Backend (Actions):
  ├─ lib/actions/bookings/instant-book.ts
  ├─ lib/actions/teacher/set-available-now.ts
  └─ lib/actions/bookings/reject.ts

✅ Frontend (Components):
  ├─ app/dashboard/teacher/instant-bookings/page.tsx
  ├─ app/dashboard/parent/instant-search/page.tsx
  ├─ components/teacher/InstantBookingCard.tsx
  └─ components/parent/BookingConfirmModal.tsx

✅ APIs:
  ├─ app/api/bookings/instant-book/route.ts
  ├─ app/api/bookings/reject/route.ts
  └─ app/api/teachers/available/route.ts

✅ WebSocket:
  └─ lib/websocket/booking-handler.ts
```

