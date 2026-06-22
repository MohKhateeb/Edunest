import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, CreditCard, Users, Calendar, AlertTriangle, ArrowUpRight, GraduationCap, TrendingUp, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import AdminAnalyticsCharts from '@/components/shared/charts/AdminAnalyticsCharts';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.userType !== 'ADMIN') redirect('/unauthorized');


  const pendingVerifications = await prisma.teacherVerification.count({
    where: { reviewedAt: null },
  });

  // --- 2. Raw Data Fetches ---
  const totalBookings = await prisma.booking.count();
  const totalStudents = await prisma.student.count();
  const activeTeachers = await prisma.teacher.count({ where: { isVerified: true } });
  
  const allBookings = await prisma.booking.findMany({
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
          teacher: { select: { specialization: true } },
        }
      }
    }
  });

  // --- 3. Compute KPIs ---
  const completedBookings = allBookings.filter(b => b.status === 'COMPLETED');
  
  let totalPlatformRevenue = 0;
  let totalBookingsValue = 0;

  for (const b of completedBookings) {
    totalBookingsValue += Number(b.price);
    if (b.isTrial) {
      totalPlatformRevenue -= Number(b.trialCostToPlatform);
    } else {
      totalPlatformRevenue += (Number(b.price) * Number(b.appliedCommissionRate)) / 100;
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
    const spec = b.teacherService.teacher.specialization;
    specCounts[spec] = (specCounts[spec] || 0) + 1;
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-primary rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -end-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -start-10 -bottom-10 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">لوحة قيادة المنصة (SaaS Dashboard)</h1>
            <p className="text-teal-100 text-sm max-w-xl leading-relaxed">
              مرحباً {session.user.name}. تتيح لك هذه اللوحة مراقبة مؤشرات الأداء الرئيسية (KPIs)، وتحليل اتجاهات الطلب الفعلي، وإدارة التدفقات المالية للمنصة بشكل مباشر.
            </p>
          </div>
          <div className="flex gap-3">

            {pendingVerifications > 0 && (
              <Link href="/dashboard/admin/verification" className="bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-white/20">
                <ShieldCheck className="h-4 w-4" /> توثيق معلمين
                <span className="bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingVerifications}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-sm hover-card border-t-4 border-t-sky-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-sky-50 dark:bg-sky-950/30 text-sky-600 rounded-xl">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-foreground">{totalStudents}</span>
            <span className="text-sm text-muted-foreground block font-semibold mt-1">إجمالي الطلاب (الطلب)</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-sm hover-card border-t-4 border-t-emerald-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-foreground">{activeTeachers}</span>
            <span className="text-sm text-muted-foreground block font-semibold mt-1">المعلمين النشطين (العرض)</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-sm hover-card border-t-4 border-t-purple-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 text-purple-600 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-foreground">{formatPrice(averageOrderValue)}</span>
            <span className="text-sm text-muted-foreground block font-semibold mt-1">متوسط قيمة الجلسة (AOV)</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-sm hover-card border-t-4 border-t-teal-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/30 text-teal-600 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-foreground">{completionRate}</span>
              <span className="text-xl font-bold text-muted-foreground">%</span>
            </div>
            <span className="text-sm text-muted-foreground block font-semibold mt-1">نسبة إكمال الحجوزات</span>
          </div>
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
