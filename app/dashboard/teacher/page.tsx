import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bookingDetailsInclude, type DetailedBooking } from '@/lib/types';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, BadgeCheck, DollarSign, Star, AlertCircle, Clock } from 'lucide-react';
import { formatPrice, sanitizePrismaData } from '@/lib/utils';
import BookingCard from '@/components/shared/BookingCard';
import TeacherEarningsChart from '@/components/shared/charts/TeacherEarningsChart';

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.user.id;

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
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
    const price = Number(b.price);
    if (b.isTrial) {
      pendingEarnings += Number(b.trialCostToPlatform);
    } else {
      const commRate = Number(b.appliedCommissionRate);
      pendingEarnings += price - (price * commRate) / 100;
    }
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

  const sanitizedPendingRequests = sanitizePrismaData(pendingRequests);
  const sanitizedNextSession = sanitizePrismaData(nextSession);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-primary to-teal-700 rounded-2xl p-6 text-white shadow-md flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">مرحباً بك، أ. {session.user.name}</h1>
          <p className="text-xs text-white/80">من لوحة التحكم يمكنك قبول حجوزات الطلاب، إدارة أوقات فراغك، ومتابعة أرباحك.</p>
        </div>
        <div className="text-left bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
          <span className="text-[10px] text-white/70 block">رابط صفحتك العامة</span>
          <Link
            href={`/teachers/${teacher.slug}`}
            className="text-xs font-semibold hover:underline flex items-center gap-1"
          >
            <span>/teachers/{teacher.slug}</span>
          </Link>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover-card">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-semibold">إجمالي الأرباح</span>
            <span className="text-lg font-extrabold text-foreground">{formatPrice(totalEarnings)}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover-card">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/20 text-teal-600 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-semibold">الحصص المكتملة</span>
            <span className="text-lg font-extrabold text-foreground">{teacher.totalSessions} حصة</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover-card">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 rounded-xl">
            <Star className="h-6 w-6 fill-currentColor" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-semibold">متوسط التقييم</span>
            <span className="text-lg font-extrabold text-foreground">
              {Number(teacher.averageRating).toFixed(1)} / 5.0
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover-card">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-semibold">حصص مجدولة قادمة</span>
            <span className="text-lg font-extrabold text-foreground">{upcomingCount} حصة</span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Earnings Chart */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2.5 mb-2">
              <h2 className="font-extrabold text-base">نشاطك في آخر 7 أيام</h2>
            </div>
            <TeacherEarningsChart data={chartData} />
          </div>

          {/* Pending Requests */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-extrabold text-base border-b border-border pb-2.5">طلبات حجز بانتظار ردك ({sanitizedPendingRequests.length})</h2>
            {sanitizedPendingRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground py-10 text-center">
                لا توجد طلبات حجز معلقة جديدة حالياً.
              </p>
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
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-extrabold text-base border-b border-border pb-2.5 text-primary flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              الجلسة المجدولة التالية
            </h2>
            {sanitizedNextSession ? (
              <BookingCard booking={sanitizedNextSession} role="TEACHER" />
            ) : (
              <p className="text-xs text-muted-foreground py-6 text-center">
                لا توجد حصص خصوصية قادمة.
              </p>
            )}
          </div>

          {/* Verification Status */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-extrabold text-base border-b border-border pb-2.5 flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              حالة التوثيق
            </h2>
            <div className="text-xs space-y-3">
              <div className="flex justify-between items-center py-1">
                <span>موثق من الإدارة:</span>
                <span className={`font-bold ${teacher.isVerified ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {teacher.isVerified ? 'نعم ✓' : 'لا'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>مستوى التوثيق:</span>
                <span className="font-bold text-primary">{teacher.verificationLevel}</span>
              </div>
              {!teacher.isVerified && (
                <div className="bg-accent/40 rounded-lg p-3 text-[11px] leading-relaxed text-muted-foreground border border-border">
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
