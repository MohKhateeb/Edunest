import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { hoursUntil } from '@/lib/utils/time';

export const metadata = {
  title: 'الأرباح والتسويات | EduNest',
};

export default async function TeacherEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId } = await requireAuth([UserType.TEACHER]);
  const resolvedParams = await searchParams;

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });

  if (!teacher) {
    return <div>حدث خطأ، لا يوجد ملف معلم.</div>;
  }

  // 1. Calculate Payouts (Paid and Pending)
  const payouts = await prisma.teacherPayout.findMany({
    where: { teacherId: teacher.id },
    orderBy: { createdAt: 'desc' },
  });

  const totalPaid = payouts.filter(p => p.isPaid).reduce((acc, curr) => acc + Number(curr.netAmount), 0);
  const totalPendingPayouts = payouts.filter(p => !p.isPaid).reduce((acc, curr) => acc + Number(curr.netAmount), 0);

  // 2. Calculate Unpayout Bookings (Past 24h vs Recent/Disputed)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const rawBookings = await prisma.booking.findMany({
    where: {
      teacherService: { teacherId: teacher.id },
      status: 'COMPLETED',
      OR: [ { paymentStatus: 'PAID' }, { isTrial: true } ],
    },
    include: { 
      dispute: true,
      student: true,
      teacherService: { include: { serviceType: true } }
    },
    orderBy: { completedAt: 'desc' },
    take: 100,
  });

  let availableToPayout = 0; // Past 24h & No open/parent-favored dispute
  let heldAmount = 0; // Within 24h OR Open Dispute

  rawBookings.forEach(b => {
    if (b.payoutId !== null) return; // Already paid out

    let price = Number(b.price);
    let commission = (price * Number(b.appliedCommissionRate)) / 100;
    let net = b.isTrial ? Number(b.trialCostToPlatform) : (price - commission);

    if (b.dispute && b.dispute.status !== 'RESOLVED_IN_FAVOR_OF_TEACHER') {
      // Disputed and not resolved in teacher's favor yet
      if (b.dispute.status === 'OPEN') {
        heldAmount += net;
      }
      return;
    }

    if (b.completedAt && b.completedAt > twentyFourHoursAgo) {
      // Less than 24h old
      heldAmount += net;
    } else {
      // Ready to be paid out
      availableToPayout += net;
    }
  });

  // Filter for payouts history
  const statusFilter = resolvedParams.status as string | undefined;
  const filteredPayouts = statusFilter 
    ? payouts.filter(p => statusFilter === 'PAID' ? p.isPaid : !p.isPaid) 
    : payouts;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">الأرباح والتسويات</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">تابع إيراداتك، والمبالغ المعلقة، وسجلات التسوية المالية الخاصة بك.</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
          <p className="text-indigo-100 font-medium mb-1">إجمالي الأرباح المستلمة</p>
          <h3 className="text-4xl font-bold">{totalPaid.toFixed(2)} <span className="text-lg font-normal opacity-80">شيكل</span></h3>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
          <p className="text-emerald-100 font-medium mb-1">الرصيد المتاح للتسوية</p>
          <h3 className="text-4xl font-bold">{availableToPayout.toFixed(2)} <span className="text-lg font-normal opacity-80">شيكل</span></h3>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
          <p className="text-amber-100 font-medium mb-1">رصيد معلق أو قيد التحويل</p>
          <h3 className="text-4xl font-bold">{(heldAmount + totalPendingPayouts).toFixed(2)} <span className="text-lg font-normal opacity-80">شيكل</span></h3>
          <p className="text-xs text-amber-200 mt-2 opacity-80">مبالغ تحت فترة الـ 24 ساعة، أو عليها نزاع، أو قيد التحويل البنكي.</p>
        </div>
      </div>

      {/* Recent Bookings Details */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">تفاصيل الجلسات والنزاعات (أحدث 100)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">التاريخ</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">الخدمة والطالب</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">صافي الربح</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة المالية</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">النزاعات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {rawBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">لا توجد جلسات مكتملة حتى الآن.</td>
                </tr>
              ) : (
                rawBookings.map((booking) => {
                  const price = Number(booking.price);
                  const commission = (price * Number(booking.appliedCommissionRate)) / 100;
                  const net = booking.isTrial ? Number(booking.trialCostToPlatform) : (price - commission);
                  const isUnder24h = booking.completedAt ? booking.completedAt > twentyFourHoursAgo : false;

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {booking.completedAt?.toLocaleDateString('ar-SA') || booking.createdAt.toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{booking.teacherService.serviceType.name}</div>
                        <div className="text-xs text-gray-500">الطالب: {booking.student.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 dark:text-white">{net.toFixed(2)}</span>
                        <span className="text-xs text-gray-500 mr-1">شيكل</span>
                        {booking.isTrial && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 rounded mr-2">جلسة تجريبية</span>}
                      </td>
                      <td className="px-6 py-4">
                        {booking.payoutId ? (
                           <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs">
                             تم تسويتها
                           </span>
                        ) : booking.dispute && booking.dispute.status !== 'RESOLVED_IN_FAVOR_OF_TEACHER' ? (
                          <span className="text-xs font-bold text-red-500">
                            {booking.dispute.status === 'OPEN' ? 'معلق بسبب نزاع' : 'مسترد لولي الأمر'}
                          </span>
                        ) : isUnder24h ? (
                           <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 text-xs">
                             محتجز (24 ساعة)
                           </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 text-xs font-bold">
                            متاح للسحب
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {booking.dispute ? (
                          <div className="flex flex-col gap-2 items-end">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                              booking.dispute.status === 'OPEN' 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}>
                              {booking.dispute.status === 'OPEN' ? 'نزاع مفتوح' : 'نزاع مغلق'}
                            </span>
                            <Link href={`/dashboard/disputes/${booking.dispute.id}`} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors">
                              فتح محادثة النزاع →
                            </Link>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payouts History */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">سجل التسويات المالية التاريخية</h2>
          
          <form className="flex items-center gap-3">
            <select 
              name="status"
              defaultValue={statusFilter}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="PAID">مدفوعة</option>
              <option value="PENDING">قيد التحويل</option>
            </select>
            <button type="submit" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
              تصفية
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">رقم التسوية</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">تاريخ الإصدار</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">الفترة من - إلى</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">الصافي</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">لا توجد تسويات مالية سابقة.</td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                      #{payout.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {payout.createdAt.toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>{payout.periodStart.toLocaleDateString('ar-SA')}</span>
                        <span className="text-gray-400">←</span>
                        <span>{payout.periodEnd.toLocaleDateString('ar-SA')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-white">{Number(payout.netAmount).toFixed(2)}</span>
                      <span className="text-xs text-gray-500 mr-1">شيكل</span>
                    </td>
                    <td className="px-6 py-4">
                      {payout.isPaid ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          تم التحويل
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          قيد التحويل البنكي
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
