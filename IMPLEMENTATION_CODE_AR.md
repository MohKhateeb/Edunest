# 💻 الإصلاحات المقترحة - الكود

## المرحلة الأولى: الإصلاحات الحرجة (Priority: HIGH)

---

## ✅ الإصلاح #1: إنشاء ParentRefund تلقائي عند الإلغاء

### **الملف:** `lib/actions/bookings/cancel.ts`

```typescript
'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, BookingStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { cancellationSchema } from '@/lib/validations/booking';
import { isValidTransition, getTransitionError } from '@/lib/utils/booking-state';
import { hoursUntil } from '@/lib/utils/time';
import { getSettingNumber } from '@/lib/settings';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function cancelBooking(
  data: z.infer<typeof cancellationSchema>
): Promise<ActionResponse> {
  try {
    const { userId, userType } = await requireAuth([
      UserType.PARENT,
      UserType.TEACHER,
      UserType.ADMIN,
    ]);

    const validated = cancellationSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { bookingId, reason } = validated.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        teacherService: {
          include: { teacher: true },
        },
        parent: true,
        payment: true, // ✅ تحميل Payment أيضاً
      },
    });

    if (!booking) {
      return { success: false, error: 'الحجز غير موجود' };
    }

    // Verify auth context
    if (userType === UserType.PARENT && booking.parentUserId !== userId) {
      return { success: false, error: 'غير مصرح لك بإلغاء هذا الحجز' };
    }
    if (userType === UserType.TEACHER && booking.teacherService.teacher.userId !== userId) {
      return { success: false, error: 'غير مصرح لك بإلغاء هذا الحجز' };
    }

    if (!isValidTransition(booking.status, BookingStatus.CANCELLED)) {
      return { success: false, error: getTransitionError(booking.status, BookingStatus.CANCELLED) };
    }

    const isTrial = booking.isTrial;
    const isTeacherCancellation = userType === UserType.TEACHER;
    const isParentCancellation = userType === UserType.PARENT;

    // Refund policy checks
    let refundEligible = false;

    if (isTeacherCancellation || userType === UserType.ADMIN) {
      refundEligible = true;
    } else if (isParentCancellation) {
      const cancelHoursWindow = await getSettingNumber('CancellationRefundHours', 24);
      const hoursLeft = hoursUntil(booking.startTime);

      if (hoursLeft >= cancelHoursWindow) {
        const maxRefunds = await getSettingNumber('MaxRefundRequests', 2);
        if (booking.parent.refundRequestsCount < maxRefunds) {
          refundEligible = true;
        } else {
          refundEligible = false;
        }
      } else {
        refundEligible = false;
      }
    }

    await prisma.$transaction(async (tx) => {
      // ✅ 1. تحديث حقول الحجز الأساسية
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledBy: userId,
          cancelledByType: userType, // ✅ NEW: حفظ نوع المُلغي
          cancelledAt: new Date(),
          cancellationReason: reason,
          paymentStatus:
            !isTrial && refundEligible && booking.paymentStatus === PaymentStatus.PAID
              ? PaymentStatus.REFUNDED
              : booking.paymentStatus,
        },
      });

      // ✅ 2. تحديث جدول Payment إذا كان هناك استرجاع
      if (!isTrial && refundEligible && booking.paymentStatus === PaymentStatus.PAID) {
        if (booking.payment) {
          await tx.payment.update({
            where: { bookingId },
            data: { isPaid: false },
          });
        }

        // ✅ 3. NEW: إنشاء سجل الاسترجاع تلقائياً
        await tx.parentRefund.create({
          data: {
            bookingId,
            amount: booking.price,
            isPaid: false, // الإدارة تؤكد التحويل البنكي
            // paidAt: null (افتراضي)
          },
        });

        // ✅ 4. NEW: تحديث عدد طلبات الاسترجاع
        await tx.user.update({
          where: { id: booking.parentUserId },
          data: {
            refundRequestsCount: { increment: 1 },
          },
        });
      }

      // ✅ 5. إشعارات معقدة
      if (refundEligible && !isTrial) {
        // إشعار ولي الأمر
        await createNotification(
          {
            userId: booking.parentUserId,
            title: '✅ تم إلغاء الحجز - الاسترجاع قيد المعالجة',
            message: `سيتم تحويل ${booking.price} ريال إلى حسابك خلال 3-5 أيام عمل`,
            link: `/dashboard/parent/financials`, // رابط للتحويلات
          },
          tx
        );

        // إشعار الإدارة
        await createNotification(
          {
            userId: 'ADMIN_ID', // ⚠️ يجب استبدالها بـ ID الإدارة الفعلي
            title: '⚠️ طلب استرجاع أموال جديد',
            message: `${booking.parent.name}: استرجاع ${booking.price} ريال - حجز ملغى`,
            link: `/dashboard/admin/refunds`,
          },
          tx
        );
      } else if (!refundEligible && isParentCancellation && !isTrial) {
        // إشعار ولي الأمر برفض الاسترجاع
        await createNotification(
          {
            userId: booking.parentUserId,
            title: '❌ لا يمكن استرجاع المبلغ',
            message: 'الإلغاء تأخر جداً أو تجاوزت حد الطلبات المسموح',
          },
          tx
        );
      }

      // إشعار المعلم
      await createNotification(
        {
          userId: booking.teacherService.teacher.userId,
          title: '❌ تم إلغاء الحجز',
          message: `تم إلغاء الحجز من قبل ${userType === UserType.PARENT ? 'ولي الأمر' : 'الإدارة'}: ${reason}`,
        },
        tx
      );
    });

    revalidatePath('/dashboard/parent/bookings');
    revalidatePath('/dashboard/teacher/bookings');
    revalidatePath('/dashboard/admin/refunds');

    return { success: true };
  } catch (err: unknown) {
    console.error('Cancel booking error:', err);
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء إلغاء الحجز';
    return { success: false, error: msg };
  }
}
```

### **التغييرات:**
1. ✅ إضافة `cancelledByType` لتتبع نوع المُلغي
2. ✅ إنشاء `ParentRefund` تلقائي عند الاسترجاع
3. ✅ تحديث `refundRequestsCount` لولي الأمر
4. ✅ إشعارات محسّنة للإدارة

---

## ✅ الإصلاح #2: حل النزاعات ينشئ Refunds

### **الملف:** `lib/actions/disputes.ts`

```typescript
'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, DisputeStatus, BookingStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createNotification } from '@/lib/notifications';
import { hoursUntil } from '@/lib/utils/time';

// ... (أكواد الـ schemas كما هي)

export async function resolveDispute(
  data: z.infer<typeof resolveDisputeSchema>
): Promise<ActionResponse> {
  try {
    const validated = resolveDisputeSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { userId } = await requireAuth([UserType.ADMIN]);
    const { disputeId, decision, adminNotes } = validated.data;

    // 1. جلب البيانات المطلوبة
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            payment: true,
            teacherService: {
              include: { teacher: true },
            },
          },
        },
      },
    });

    if (!dispute) {
      return { success: false, error: 'النزاع غير موجود' };
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      return { success: false, error: 'هذا النزاع تم حله مسبقاً' };
    }

    const booking = dispute.booking;

    // 2. معالجة الحل (transaction)
    await prisma.$transaction(async (tx) => {
      // ✅ تحديث الحالة الأساسية للنزاع
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: decision,
          adminNotes,
          resolvedAt: new Date(),
          resolvedBy: userId,
        },
      });

      // ✅ معالجة خاصة حسب قرار الحل
      if (decision === DisputeStatus.RESOLVED_IN_FAVOR_OF_PARENT) {
        // NEW: استرجاع أموال كامل للولي

        // 1. تحديث Booking
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
          },
        });

        // 2. تحديث Payment
        if (booking.payment) {
          await tx.payment.update({
            where: { bookingId: booking.id },
            data: {
              isPaid: false,
            },
          });
        }

        // 3. NEW: إنشاء ParentRefund
        await tx.parentRefund.create({
          data: {
            bookingId: booking.id,
            amount: booking.price,
            isPaid: false,
          },
        });

        // 4. NEW: إشعار ولي الأمر
        await createNotification(
          {
            userId: booking.parentUserId,
            title: '✅ تم حل النزاع لصالحك',
            message: `المبلغ ${booking.price} ريال سيُحوّل إلى حسابك خلال 3-5 أيام عمل`,
            link: `/dashboard/parent/financials`,
          },
          tx
        );

        // 5. NEW: إشعار المعلم برفض
        await createNotification(
          {
            userId: booking.teacherService.teacher.userId,
            title: '⚠️ تم حل النزاع ضدك',
            message: `تم حل النزاع لصالح ولي الأمر - سيتم خصم ${booking.price} ريال من أرباحك`,
          },
          tx
        );
      } else if (decision === DisputeStatus.RESOLVED_IN_FAVOR_OF_TEACHER) {
        // المعلم يحصل على أرباحه (لا تغيير في الحالة)

        // إشعار ولي الأمر
        await createNotification(
          {
            userId: booking.parentUserId,
            title: '⚠️ تم حل النزاع ضد طلبك',
            message: 'تم التحقق من الشكوى ولم نجد أساساً لها - لن يتم استرجاع المبلغ',
          },
          tx
        );

        // إشعار المعلم
        await createNotification(
          {
            userId: booking.teacherService.teacher.userId,
            title: '✅ تم حل النزاع لصالحك',
            message: 'تم التحقق من الشكوى - أرباحك آمنة وستُحول في التسوية القادمة',
          },
          tx
        );
      }

      // 6. إشعار الإدارة (للتسجيل)
      await createNotification(
        {
          userId: 'ADMIN_ID',
          title: '📋 تم حل نزاع',
          message: `النزاع ${disputeId} - تم الحل: ${decision}`,
        },
        tx
      );
    });

    revalidatePath('/dashboard/admin/disputes');
    revalidatePath('/dashboard/parent/bookings');
    revalidatePath('/dashboard/teacher/bookings');

    return { success: true };
  } catch (err: unknown) {
    console.error('Resolve dispute error:', err);
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء حل النزاع';
    return { success: false, error: msg };
  }
}
```

### **التغييرات:**
1. ✅ إنشاء `ParentRefund` تلقائي عند حل لصالح الولي
2. ✅ تحديث حالة الدفع والـ Payment
3. ✅ إشعارات واضحة لجميع الأطراف

---

## ✅ الإصلاح #3: فحص صارم على حالة Ghost

### **الملف:** `lib/utils/booking-state.ts`

```typescript
import { BookingStatus } from '@prisma/client';
import { BOOKING_STATUS_AR } from '@/lib/translations';

// ... (الكود السابق)

/**
 * التحقق مما إذا كان المعلم يحق له كتابة تقرير (الجلسة انتهت فعلاً)
 * ✅ FIXED: منع إرسال التقرير بعد 24 ساعة
 */
export function canSubmitReport(startTime: Date | string, durationMinutes: number): boolean {
  const state = getDetailedSessionState(startTime, durationMinutes);
  
  // ✅ FIXED: منع حالة 'ghost'
  if (state.status === 'ghost') {
    return false;
  }
  
  return ['grace_period', 'expired'].includes(state.status);
}

/**
 * معالجة التقارير المفقودة (يومية - cron job)
 * NEW: إضافة هذه الدالة إلى مهمة يومية
 */
export async function handleMissingReports() {
  const prisma = require('@/lib/prisma').prisma;
  const createNotification = require('@/lib/notifications').createNotification;

  try {
    // 1. البحث عن حجوزات مكتملة بدون تقرير
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const missingReports = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        completedAt: { lte: oneDayAgo },
        report: null,
        teacherService: {
          include: { teacher: true },
        },
      },
      include: {
        teacherService: {
          include: { teacher: true },
        },
      },
    });

    for (const booking of missingReports) {
      // 2a. التنبيه الأول: بعد 23 ساعة
      const hoursElapsed = Math.floor(
        (new Date().getTime() - new Date(booking.completedAt).getTime()) / (1000 * 60 * 60)
      );

      if (hoursElapsed === 23) {
        await createNotification({
          userId: booking.teacherService.teacher.userId,
          title: '⏰ تحذير: ساعة واحدة فقط لإرسال التقرير',
          message: 'يجب إرسال التقرير قبل 24 ساعة من انتهاء الجلسة - بقي ساعة واحدة فقط',
        });
      }

      // 2b. بعد 24 ساعة: إنشاء تقرير افتراضي
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      if (booking.completedAt && booking.completedAt <= twoDaysAgo) {
        // إنشاء تقرير افتراضي (فشل المعلم)
        await prisma.sessionReport.create({
          data: {
            bookingId: booking.id,
            studentAttended: false,
            topicsCovered: '[تقرير نظام: لم يُرسل المعلم تقرير الجلسة]',
            studentPerformance: 1,
            teacherNotes:
              'تم إنشاء هذا التقرير تلقائياً - المعلم لم يرسل تقرير الجلسة في الوقت المحدد',
          },
        });

        // تحديث الحجز ليعكس أن التقرير تم (افتراضي)
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.COMPLETED, // يبقى كما هو
            // التقرير الافتراضي يمنع المعلم من الدخول في التسوية
          },
        });

        // تنبيهات
        await createNotification({
          userId: booking.teacherService.teacher.userId,
          title: '❌ فشلت في إرسال التقرير',
          message:
            'لم ترسل تقرير الجلسة في الوقت المحدد - لن تحصل على أرباح من هذه الجلسة',
        });

        await createNotification({
          userId: booking.parentUserId,
          title: '⚠️ لم يرسل المعلم تقرير الجلسة',
          message:
            'المعلم لم يرسل تقرير الجلسة في الوقت المحدد - تم تسجيل هذا في ملفه',
        });

        // تنبيه الإدارة
        await createNotification({
          userId: 'ADMIN_ID',
          title: '🚨 معلم متكرر في التأخير',
          message: `المعلم ${booking.teacherService.teacher.id} لم يرسل تقرير الجلسة #${booking.id}`,
        });
      }
    }
  } catch (err) {
    console.error('Error handling missing reports:', err);
  }
}
```

---

## ✅ الإصلاح #4: إضافة cancelledByType إلى Schema

### **الملف:** `prisma/schema.prisma`

```prisma
model Booking {
  id                    String         @id @default(cuid())
  parentUserId          String
  parent                User           @relation("ParentBookings", fields: [parentUserId], references: [id], onDelete: Restrict)
  studentId             String
  student               Student        @relation(fields: [studentId], references: [id], onDelete: Restrict)
  teacherServiceId      String
  teacherService        TeacherService @relation(fields: [teacherServiceId], references: [id], onDelete: Restrict)
  startTime             DateTime
  duration              Int
  price                 Decimal        @db.Decimal(10, 2)
  appliedCommissionRate Decimal        @db.Decimal(5, 2)
  status                BookingStatus  @default(PENDING)
  paymentStatus         PaymentStatus  @default(UNPAID)
  bookingSource         BookingSource  @default(WEB)
  meetingUrl            String?
  questionTitle         String?
  questionDetails       String?
  questionImageUrl      String?
  isTrial               Boolean        @default(false)
  trialCostToPlatform   Decimal        @default(0) @db.Decimal(10, 2)
  parentNotes           String?
  teacherNotes          String?
  cancellationReason    String?
  cancelledBy           String?
  
  // ✅ NEW: حفظ نوع المُلغي (PARENT | TEACHER | ADMIN)
  cancelledByType       UserType?
  
  payoutId              String?
  createdAt             DateTime       @default(now())
  confirmedAt           DateTime?
  completedAt           DateTime?
  cancelledAt           DateTime?
  
  report                SessionReport?
  review                Review?
  payment               Payment?
  cancellingUser        User?          @relation("CancelledByUser", fields: [cancelledBy], references: [id])
  payout                TeacherPayout? @relation("BookingPayout", fields: [payoutId], references: [id])
  dispute               Dispute?
  parentRefund          ParentRefund?

  @@index([parentUserId])
  @@index([teacherServiceId])
  @@index([status])
  @@index([isTrial])
  @@index([startTime])
  @@index([paymentStatus])
  @@index([payoutId])
  @@index([cancelledByType]) // ✅ NEW: فهرس للتقارير السريعة
}
```

### **الهجرة:**

```bash
# إنشاء هجرة جديدة
npx prisma migrate dev --name add_cancelled_by_type
```

---

## ✅ الإصلاح #5: تحسين معالجة الأخطاء

### **الملف:** `lib/actions/bookings/report.ts`

```typescript
'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { reportSchema } from '@/lib/validations/booking';
import { isValidTransition, getTransitionError, canSubmitReport } from '@/lib/utils/booking-state';
import { createNotification } from '@/lib/notifications';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function submitSessionReport(
  data: z.infer<typeof reportSchema>
): Promise<ActionResponse> {
  try {
    const { userId } = await requireAuth([UserType.TEACHER]);

    const validated = reportSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const {
      bookingId,
      studentAttended,
      topicsCovered,
      studentPerformance,
      homeworkAssigned,
      teacherNotes,
    } = validated.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        teacherService: {
          include: { teacher: true },
        },
        report: true, // ✅ NEW: التحقق من وجود تقرير سابق
      },
    });

    if (!booking || booking.teacherService.teacher.userId !== userId) {
      return { success: false, error: 'الحجز غير موجود أو غير تابع لك' };
    }

    // ✅ NEW: فحص إذا كان هناك تقرير سابق
    if (booking.report) {
      return { success: false, error: 'تم إرسال تقرير لهذه الجلسة مسبقاً' };
    }

    if (!isValidTransition(booking.status, BookingStatus.COMPLETED)) {
      return { success: false, error: getTransitionError(booking.status, BookingStatus.COMPLETED) };
    }

    // ✅ FIXED: فحص صارم على الحالة الزمنية
    if (!canSubmitReport(booking.startTime, booking.duration)) {
      const state = require('@/lib/utils/booking-state').getDetailedSessionState(
        booking.startTime,
        booking.duration
      );

      let errorMsg = 'لا يمكن تقديم التقرير الآن';
      if (state.status === 'upcoming') {
        errorMsg = `الجلسة لم تبدأ بعد - يتبقى ${state.minutesLeft} دقيقة`;
      } else if (state.status === 'active') {
        errorMsg = 'الجلسة لا تزال جارية - انتظر انتهاءها';
      } else if (state.status === 'ghost') {
        errorMsg = 'انتهت فترة السماح لإرسال التقرير (24 ساعة من الانتهاء)';
      }

      return { success: false, error: errorMsg };
    }

    // Save report and mark booking COMPLETED in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create session report
      await tx.sessionReport.create({
        data: {
          bookingId,
          studentAttended,
          topicsCovered,
          studentPerformance,
          homeworkAssigned,
          teacherNotes,
        },
      });

      // 2. Mark booking completed
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // 3. Increment teacher total sessions completed
      await tx.teacher.update({
        where: { id: booking.teacherService.teacherId },
        data: {
          totalSessions: { increment: 1 },
        },
      });

      // 4. Notify parent with report details
      await createNotification(
        {
          userId: booking.parentUserId,
          title: 'تقرير الجلسة التعليمية جاهز',
          message: `قام المعلم برفع تقرير الحصة. يرجى مراجعة تفاصيل الجلسة.`,
          link: `/dashboard/parent/bookings/${bookingId}`,
        },
        tx
      );
    });

    revalidatePath('/dashboard/teacher/bookings');
    revalidatePath('/dashboard/parent/bookings');

    return { success: true };
  } catch (err: unknown) {
    console.error('Submit session report error:', err);
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء رفع التقرير';
    return { success: false, error: msg };
  }
}
```

---

## 🗃️ الهجرات (Migrations)

### **الملف:** `prisma/migrations/[timestamp]_add_cancelled_by_type/migration.sql`

```sql
-- ✅ إضافة حقل cancelledByType
ALTER TABLE "Booking" ADD COLUMN "cancelledByType" "UserType";

-- ✅ إضافة فهرس للتقارير السريعة
CREATE INDEX "Booking_cancelledByType_idx" ON "Booking"("cancelledByType");
```

---

## 📊 جدول التغييرات

| الملف | التغيير | الحدة | الفائدة |
|------|--------|------|--------|
| `cancel.ts` | ParentRefund تلقائي + cancelledByType | 🔴 عالي | منع خسارة الأموال |
| `disputes.ts` | Refund عند حل النزاع | 🔴 عالي | عدالة مالية |
| `booking-state.ts` | فحص ghost + handleMissingReports | 🔴 عالي | منع الاحتيال |
| `schema.prisma` | cancelledByType | 🟢 منخفض | تحليلات أفضل |
| `report.ts` | معالجة أخطاء محسّنة | 🟡 متوسط | تجربة أفضل |

---

## ⚙️ خطوات التطبيق

### **1. تحديث الملفات**
```bash
# نسخ الأكواد المقترحة إلى الملفات الموجودة
# (استبدال الأكواد القديمة بالجديدة)
```

### **2. إنشاء الهجرة**
```bash
cd /path/to/project
npx prisma migrate dev --name add_cancelled_by_type
```

### **3. اختبار محلي**
```bash
npm run dev
# اختبر جميع السيناريوهات الخمسة
```

### **4. نشر على الإنتاج**
```bash
npm run build
npm run start
npx prisma migrate deploy
```

### **5. جدولة المهام التلقائية**
```typescript
// في API routes أو استخدم خدمة مثل BullMQ/node-cron
// استدعي handleMissingReports() يومياً الساعة 2 صباحاً
```

