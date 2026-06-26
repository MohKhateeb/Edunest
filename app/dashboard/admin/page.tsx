import { auth } from '@/lib/auth';
import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ShieldCheck, CreditCard, Users, Calendar, AlertTriangle, ArrowUpRight, GraduationCap, TrendingUp, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { calculateEarnings } from '@/lib/utils/financial';
import AdminAnalyticsCharts from '@/components/shared/charts/AdminAnalyticsCharts';
import InteractiveMessage from '@/components/shared/InteractiveMessage';

export default async function AdminDashboard() {
  await requireAuth([UserType.ADMIN]);
  const session = await auth();
  await requireAuth([UserType.ADMIN]);

  if (!session) return null;
  const pendingVerifications = await prisma.teacherVerification.count({
    where: { reviewedAt: null },
  });

  // --- 2. Raw Data Fetches ---
  const totalBookings = await prisma.booking.count();
  const totalStudents = await prisma.student.count();
  const activeTeachers = await prisma.teacher.count({ where: { isVerified: true } });
  
  const allBookings = await prisma.booking.findMany({
    take: 500,
    orderBy: { createdAt: 'desc' },
    select: {
      status: true,
      price: true,
      appliedCommissionRate: true,
      isTrial: true,
      trialCostToPlatform: true,
      completedAt: true,
      teacherService: {
        select: {
          serviceType: { select: { name: true } },
          teacher: { select: { subjects: { include: { subject: true } } } },
        }
      }
    }
  });

  // --- 3. Compute KPIs ---
  const completedBookings = allBookings.filter(b => b.status === 'COMPLETED');
  
  let totalPlatformRevenue = 0;
  let totalBookingsValue = 0;

  for (const b of completedBookings) {
    const earnings = calculateEarnings(
      Number(b.price),
      Number(b.appliedCommissionRate),
      b.isTrial,
      Number(b.trialCostToPlatform)
    );
    totalBookingsValue += earnings.totalAmount;
    if (b.isTrial) {
      totalPlatformRevenue -= earnings.trialCompensation;
    } else {
      totalPlatformRevenue += earnings.commissionAmount;
    }
  }

  const averageOrderValue = completedBookings.length > 0 ? (totalBookingsValue / completedBookings.length) : 0;
  const completionRate = totalBookings > 0 ? ((completedBookings.length / totalBookings) * 100).toFixed(1) : '0.0';

  // --- 4. Chart: Booking Statuses ---
  const statusCounts: Record<string, number> = {};
  for (const b of allBookings) {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
  }
  const statusMap: Record<string, string> = {
    'COMPLETED': 'مكتمل', 'CONFIRMED': 'مؤكد', 'PENDING': 'معلق', 'CANCELLED': 'ملغي', 'REJECTED': 'مرفوض',
  };
  const bookingStatuses = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusMap[status] || status,
    value: count,
  }));

  // --- 5. Chart: Platform Revenue Trends (Last 14 Days) ---
  const revenueMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('ar-PS', { month: 'short', day: 'numeric' });
    revenueMap.set(dateStr, 0);
  }
  for (const b of completedBookings) {
    if (!b.completedAt) continue;
    const dateStr = b.completedAt.toLocaleDateString('ar-PS', { month: 'short', day: 'numeric' });
    if (revenueMap.has(dateStr)) {
      let rev = 0;
      if (b.isTrial) rev -= Number(b.trialCostToPlatform);
      else rev = (Number(b.price) * Number(b.appliedCommissionRate)) / 100;
      revenueMap.set(dateStr, (revenueMap.get(dateStr) || 0) + rev);
    }
  }
  const revenueData = Array.from(revenueMap.entries()).map(([date, revenue]) => ({ date, revenue }));

  // --- 6. Chart: Most Requested Specializations ---
  const specCounts: Record<string, number> = {};
  for (const b of allBookings) {
    const subjects = b.teacherService.teacher.subjects;
    if (subjects && subjects.length > 0) {
      for (const s of subjects) {
        const spec = s.subject.name;
        specCounts[spec] = (specCounts[spec] || 0) + 1;
      }
    } else {
      const spec = 'غير محدد';
      specCounts[spec] = (specCounts[spec] || 0) + 1;
    }
  }
  const requestedSpecializations = Object.entries(specCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // --- 7. Chart: Most Requested Session Types ---
  const typeCounts: Record<string, number> = {};
  for (const b of allBookings) {
    const type = b.teacherService.serviceType.name;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  const sessionTypes = Object.entries(typeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // --- 8. Chart: Most Registered Grades ---
  const gradeGroups = await prisma.student.groupBy({
    by: ['grade'],
    _count: { grade: true },
  });
  const registeredGrades = gradeGroups
    .map(g => ({ name: `الصف ${g.grade}`, count: g._count.grade, grade: g.grade }))
    .sort((a, b) => a.grade - b.grade) // Sort by grade naturally 1 -> 12
    .map(({ grade, ...rest }) => rest);

  return (
    <div className="space-y-8 text-right pb-10" dir="rtl">
      {/* Welcome header & Interactive Message */}
      <div className="mt-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <InteractiveMessage 
          character="hakeem"
          title={`أهلاً بك، ${session.user.name}`}
          message="تتيح لك لوحة القيادة مراقبة مؤشرات الأداء الرئيسية (KPIs)، وتحليل اتجاهات الطلب الفعلي، وإدارة التدفقات المالية للمنصة بشكل مباشر. راقب الأرقام لضمان النمو."
          className="lg:w-2/3"
        />
        {pendingVerifications > 0 && (
          <Link 
            href="/dashboard/admin/verification" 
            className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-4 rounded-2xl shadow-md transition-all font-black flex items-center gap-2 animate-pulse-soft"
          >
            <ShieldCheck className="h-5 w-5" /> 
            توثيق معلمين
            <span className="bg-white text-yellow-600 text-xs px-2 py-0.5 rounded-full mr-2">{pendingVerifications}</span>
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        
        <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
          <div className="p-2 bg-sky-50 dark:bg-sky-950/30 text-sky-600 rounded-2xl mb-2">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-2xl font-black text-foreground mb-1">{totalStudents}</span>
          <span className="text-xs text-muted-foreground font-bold">إجمالي الطلاب</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl mb-2">
            <Users className="h-5 w-5" />
          </div>
          <span className="text-2xl font-black text-foreground mb-1">{activeTeachers}</span>
          <span className="text-xs text-muted-foreground font-bold">معلمين نشطين</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
          <div className="p-2 bg-purple-50 dark:bg-purple-950/30 text-purple-600 rounded-2xl mb-2">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-2xl font-black text-foreground mb-1">{formatPrice(averageOrderValue)}</span>
          <span className="text-xs text-muted-foreground font-bold">متوسط الدفع (AOV)</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
          <div className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-600 rounded-2xl mb-2">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground mb-1">{completionRate}</span>
            <span className="text-sm font-bold text-muted-foreground">%</span>
          </div>
          <span className="text-xs text-muted-foreground font-bold">إكمال الحجوزات</span>
        </div>

      </div>

      {/* Analytics Charts Component */}
      <AdminAnalyticsCharts 
        bookingStatuses={bookingStatuses}
        requestedSpecializations={requestedSpecializations}
        sessionTypes={sessionTypes}
        registeredGrades={registeredGrades}
        revenue={revenueData}
      />
      
    </div>
  );
}
