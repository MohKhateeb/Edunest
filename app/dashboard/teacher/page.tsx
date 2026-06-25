import { auth } from '@/lib/auth';
import { requireAuth } from '@/lib/require-auth';
import { UserType, BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { bookingDetailsInclude, type DetailedBooking } from '@/lib/types';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, BadgeCheck, DollarSign, Star, AlertCircle, Clock } from 'lucide-react';
import { formatPrice, sanitizePrismaData } from '@/lib/utils';
import { calculateEarnings } from '@/lib/utils/financial';
import BookingCard from '@/components/shared/BookingCard';
import TeacherEarningsChart from '@/components/shared/charts/TeacherEarningsChart';
import InteractiveMessage from '@/components/shared/InteractiveMessage';
import TeacherOnlineToggle from '@/components/shared/TeacherOnlineToggle';

export default async function TeacherDashboard() {
  await requireAuth([UserType.TEACHER]);
  const session = await auth();

  if (!session) return null;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { name: true } },
    },
  });

  if (!teacher) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
        <h3 className="font-extrabold text-lg">لم تقم بإعداد ملفك الشخصي بعد</h3>
        <p className="text-xs text-muted-foreground">
          يرجى إدخال بيانات التخصص والمدن التي تدرس بها وسعر حِصتك الخصوصية لتتمكن من استقبال الحجوزات.
        </p>
        <Link
          href="/dashboard/teacher/profile"
          className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          أكمل ملفك الشخصي
        </Link>
      </div>
    );
  }

  // Fetch count stats
  const upcomingCount = await prisma.booking.count({
    where: {
      teacherService: { teacherId: teacher.id },
      status: 'CONFIRMED',
      startTime: { gte: new Date() },
    },
  });

  const pendingRequests: DetailedBooking[] = await prisma.booking.findMany({
    where: {
      teacherService: { teacherId: teacher.id },
      status: 'PENDING',
    },
    include: bookingDetailsInclude,
    orderBy: { createdAt: 'desc' },
  });

  // Calculate unpaid net earnings + paid payouts
  const completedUnpaidBookings = await prisma.booking.findMany({
    take: 500,
    orderBy: { completedAt: 'desc' },
    where: {
      teacherService: { teacherId: teacher.id },
      status: 'COMPLETED',
      payoutId: null,
      OR: [
        { paymentStatus: 'PAID' },
        { isTrial: true },
      ],
    },
  });

  let pendingEarnings = 0;
  for (const b of completedUnpaidBookings) {
    const earnings = calculateEarnings(
      Number(b.price),
      Number(b.appliedCommissionRate),
      b.isTrial,
      Number(b.trialCostToPlatform)
    );
    pendingEarnings += earnings.teacherTotalEarnings;
  }

  const paidPayoutsSum = await prisma.teacherPayout.aggregate({
    where: { teacherId: teacher.id, isPaid: true },
    _sum: { netAmount: true },
  });

  const totalEarnings = pendingEarnings + Number(paidPayoutsSum._sum.netAmount || 0);

  // Compute chart data (last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  
  const last7DaysStart = last7Days[0];
  
  const recentCompletedBookings = await prisma.booking.findMany({
    where: {
      teacherService: { teacherId: teacher.id },
      status: 'COMPLETED',
      startTime: { gte: last7DaysStart }
    }
  });

  const chartData = last7Days.map((date) => {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const dayBookings = recentCompletedBookings.filter(b => 
      b.startTime >= date && b.startTime < nextDate
    );

    let earnings = 0;
    for (const b of dayBookings) {
      if (b.isTrial) {
        earnings += Number(b.trialCostToPlatform);
      } else {
        const price = Number(b.price);
        const commRate = Number(b.appliedCommissionRate);
        earnings += price - (price * commRate) / 100;
      }
    }

    return {
      date: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
      earnings: earnings,
      sessions: dayBookings.length,
    };
  });

  // Fetch next upcoming session
  const nextSession: DetailedBooking | null = await prisma.booking.findFirst({
    where: {
      teacherService: { teacherId: teacher.id },
      status: 'CONFIRMED',
      startTime: { gte: new Date() },
    },
    include: bookingDetailsInclude,
    orderBy: { startTime: 'asc' },
  });

  // Fetch potentially LIVE session (started in the past but hasn't been completed)
  const recentStartedSession: DetailedBooking | null = await prisma.booking.findFirst({
    where: {
      teacherService: { teacherId: teacher.id },
      status: 'CONFIRMED',
      startTime: { lte: new Date() },
    },
    include: bookingDetailsInclude,
    orderBy: { startTime: 'desc' },
  });

  let liveSession = null;
  if (recentStartedSession) {
    const startMs = recentStartedSession.startTime.getTime();
    const durationMs = recentStartedSession.duration * 60000;
    const graceMs = 30 * 60000; // 30 minutes grace period
    if (Date.now() <= startMs + durationMs + graceMs) {
      liveSession = recentStartedSession;
    }
  }

  // Fetch open disputes involving this teacher
  const openDisputes = await prisma.dispute.findMany({
    where: {
      booking: {
        teacherService: {
          teacherId: teacher.id,
        },
      },
      status: 'OPEN',
    },
    include: {
      booking: {
        include: { student: true }
      }
    }
  });

  const sanitizedPendingRequests = sanitizePrismaData(pendingRequests);
  const sanitizedNextSession = sanitizePrismaData(nextSession);
  const sanitizedLiveSession = liveSession ? sanitizePrismaData(liveSession) : null;

  return (
    <div className="space-y-8 text-right pb-10" dir="rtl">
      {/* Welcome header */}
      <div className="mt-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <InteractiveMessage 
          character="najeeb"
          title={`أهلاً بك، أ. ${session.user.name} 👋`}
          message="من لوحة التحكم يمكنك قبول حجوزات الطلاب، إدارة أوقات فراغك، ومتابعة أرباحك بسلاسة."
          najeebMode="welcome"
          className="lg:w-1/2"
        />
        <div className="flex flex-col gap-3 shrink-0">
          <TeacherOnlineToggle initialStatus={teacher.isAvailableNow} />
          
          <div className="text-left bg-gradient-to-l from-primary to-blue-400 px-6 py-4 rounded-2xl shadow-md text-white animate-pulse-soft">
            <span className="text-xs text-white/80 block mb-1">رابط صفحتك العامة للطلاب</span>
            <Link
              href={`/teachers/${teacher.slug}`}
              className="text-sm font-black hover:underline flex items-center gap-1"
            >
              <span>edunest.com/teachers/{teacher.slug}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Urgent Matters Section */}
      {(openDisputes.length > 0 || !teacher.isVerified) && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-3xl p-6 shadow-sm">
          <h2 className="font-black text-lg text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
            <AlertCircle className="h-6 w-6" />
            أمور عاجلة تتطلب تدخلك
          </h2>
          <div className="space-y-3">
            {!teacher.isVerified && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center justify-between border border-red-100 dark:border-red-900/50">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  حسابك غير موثق حتى الآن! لا يمكنك الظهور في محرك البحث للطلاب.
                </div>
                <Link href="/dashboard/teacher/verification" className="text-xs bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700">
                  وثق حسابك الآن
                </Link>
              </div>
            )}
            {openDisputes.map(dispute => (
              <div key={dispute.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex items-center justify-between border border-red-100 dark:border-red-900/50">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  لديك نزاع مفتوح مع الطالب <span className="text-primary">{dispute.booking.student.name}</span> بخصوص إحدى الجلسات. الإدارة تنتظر ردك.
                </div>
                <Link href={`/dashboard/disputes/${dispute.id}`} className="text-xs bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700">
                  عرض النزاع والرد
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Session Banner */}
      {sanitizedLiveSession && (
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-6 shadow-xl shadow-rose-500/20 text-white animate-in zoom-in duration-300 relative overflow-hidden border border-rose-400/30">
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <h2 className="font-black text-xl text-white">الجلسة الفورية بدأت الآن!</h2>
              </div>
              <p className="text-white/90 text-sm font-semibold">
                تم الدفع بنجاح. الطالب {sanitizedLiveSession.student.name} بانتظارك في الجلسة.
              </p>
            </div>
            {sanitizedLiveSession.meetingUrl ? (
              <a
                href={sanitizedLiveSession.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-white text-rose-600 hover:bg-rose-50 px-8 py-3 rounded-xl font-black shadow-lg transition-transform hover:scale-105 whitespace-nowrap text-center"
              >
                ادخل الجلسة الآن
              </a>
            ) : (
              <div className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold">
                جاري تجهيز الرابط...
              </div>
            )}
          </div>
        </div>
      )}

      {/* الموجز المالي والتفاعلي للحكيم */}
      <div className="pt-2 border-t border-border/50">
        <InteractiveMessage 
          character="hakeem"
          title="موجز الحكيم لإدارة حصصك"
          message={sanitizedPendingRequests.length > 0 
            ? `لديك ${sanitizedPendingRequests.length} طلب حجز بانتظار ردك! سارع بتأكيدها لزيادة موثوقيتك عند الطلاب.`
            : "أمورك ممتازة! احرص على تحديث أوقات فراغك باستمرار لاستقبال حجوزات جديدة."}
        />

        {/* Grid Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
            <div className="p-2 bg-primary/10 text-primary rounded-2xl mb-2">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black text-foreground mb-1">{formatPrice(totalEarnings)}</span>
            <span className="text-xs text-muted-foreground font-bold">إجمالي الأرباح</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
            <div className="p-2 bg-teal-50 dark:bg-teal-950/20 text-teal-600 rounded-2xl mb-2">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black text-foreground mb-1">{teacher.totalSessions}</span>
            <span className="text-xs text-muted-foreground font-bold">حصص مكتملة</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 rounded-2xl mb-2">
              <Star className="h-5 w-5 fill-currentColor" />
            </div>
            <span className="text-2xl font-black text-foreground mb-1">{Number(teacher.averageRating).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground font-bold">متوسط التقييم</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-2xl mb-2">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-2xl font-black text-foreground mb-1">{upcomingCount}</span>
            <span className="text-xs text-muted-foreground font-bold">حصص قادمة</span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Earnings Chart */}
          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h2 className="font-black text-lg flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                نشاطك المالي (آخر 7 أيام)
              </h2>
            </div>
            <TeacherEarningsChart data={chartData} />
          </div>

          {/* Pending Requests */}
          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2 border-b border-border pb-3">
              <Clock className="h-6 w-6 text-secondary" />
              طلبات حجز بانتظار ردك ({sanitizedPendingRequests.length})
            </h2>
            {sanitizedPendingRequests.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground font-semibold">
                  لا توجد طلبات حجز معلقة حالياً.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sanitizedPendingRequests.map((req) => (
                  <BookingCard key={req.id} booking={req} role="TEACHER" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* Next Lesson */}
          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
            <h2 className="font-black text-lg border-b border-border pb-3 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              الجلسة المجدولة التالية
            </h2>
            {sanitizedNextSession ? (
              <BookingCard booking={sanitizedNextSession} role="TEACHER" />
            ) : (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground font-semibold">
                  لا توجد حصص مجدولة قادمة.
                </p>
              </div>
            )}
          </div>

          {/* Verification Status */}
          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
            <h2 className="font-black text-lg border-b border-border pb-3 flex items-center gap-2">
              <BadgeCheck className="h-6 w-6 text-emerald-500" />
              حالة التوثيق
            </h2>
            <div className="text-sm space-y-3 font-semibold">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">موثق من الإدارة:</span>
                <span className={`font-black ${teacher.isVerified ? 'text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg' : 'text-slate-500'}`}>
                  {teacher.isVerified ? 'نعم ✓' : 'لا'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">مستوى التوثيق:</span>
                <span className="font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">{teacher.verificationLevel}</span>
              </div>
              {!teacher.isVerified && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-2xl p-4 text-xs leading-relaxed border border-yellow-200 dark:border-yellow-800 mt-2">
                  يرجى الانتقال لصفحة <strong>وثائق التوثيق</strong> ورفع هويتك والشهادة الجامعية ليتم تفعيل حسابك وعرضه في البحث.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
