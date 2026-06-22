import { requireAuth } from '@/lib/require-auth';
import { UserType, DisputeStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const metadata = {
  title: 'الإدارة المالية الشاملة | EduNest',
};

export default async function AdminFinancialsPage() {
  await requireAuth([UserType.ADMIN]);

  // 1. Fetch Action Items (To-Dos)
  const openDisputesCount = await prisma.dispute.count({
    where: { status: 'OPEN' },
  });

  const pendingPayoutsCount = await prisma.teacherPayout.count({
    where: { isPaid: false },
  });

  // 2. Platform Revenue & Stats
  const completedBookings = await prisma.booking.findMany({
    where: { status: 'COMPLETED' },
  });

  const totalRevenue = completedBookings.reduce((acc, b) => acc + Number(b.price), 0);
  const totalCommission = completedBookings.reduce((acc, b) => acc + (Number(b.price) * Number(b.appliedCommissionRate) / 100), 0);

  // 3. Fetch Open Disputes
  const openDisputes = await prisma.dispute.findMany({
    where: { status: 'OPEN' },
    include: {
      booking: {
        include: {
          teacherService: { include: { teacher: { include: { user: true } } } },
          student: true,
          parent: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 5,
  });

  // 4. Fetch Pending Payouts
  const pendingPayouts = await prisma.teacherPayout.findMany({
    where: { isPaid: false },
    include: { teacher: { include: { user: true } } },
    orderBy: { createdAt: 'asc' },
    take: 5,
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">الإدارة المالية الشاملة</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">نظرة عامة على الإيرادات، المهام المالية المطلوبة، وتسويات المعلمين.</p>
      </div>

      {/* Action Items (To-Dos) */}
      {(openDisputesCount > 0 || pendingPayoutsCount > 0) && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-2xl p-5 shadow-sm">
          <h3 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2 mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            مهام تتطلب الإجراء
          </h3>
          <ul className="space-y-2">
            {openDisputesCount > 0 && (
              <li className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-red-100 dark:border-gray-700">
                <span className="text-gray-700 dark:text-gray-300">يوجد <strong className="text-red-600">{openDisputesCount}</strong> اعتراضات مفتوحة بانتظار قرار الإدارة.</span>
                <a href="#disputes" className="text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-1.5 rounded-lg hover:bg-red-200 transition-colors">مراجعة النزاعات</a>
              </li>
            )}
            {pendingPayoutsCount > 0 && (
              <li className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-orange-100 dark:border-gray-700">
                <span className="text-gray-700 dark:text-gray-300">يوجد <strong className="text-orange-600">{pendingPayoutsCount}</strong> تسويات مالية بانتظار التحويل البنكي للمعلمين.</span>
                <a href="#payouts" className="text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-4 py-1.5 rounded-lg hover:bg-orange-200 transition-colors">مراجعة التسويات</a>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">إجمالي التداول (Gross)</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{totalRevenue.toFixed(2)}</h3>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-sm text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
          <p className="text-emerald-100 mb-1">أرباح المنصة (العمولة)</p>
          <h3 className="text-3xl font-bold">{totalCommission.toFixed(2)}</h3>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Disputes Section */}
        <section id="disputes" className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              نزاعات قيد المراجعة
            </h2>
            <span className="text-sm text-gray-500">أقدم 5 نزاعات</span>
          </div>
          <div className="p-4 flex-1">
            {openDisputes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
                <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p>لا توجد نزاعات مفتوحة حالياً. عمل رائع!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {openDisputes.map(dispute => (
                  <div key={dispute.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900 dark:text-white">اعتراض من ولي الأمر: {dispute.booking.parent.name}</h4>
                      <span className="text-xs text-gray-500">{dispute.createdAt.toLocaleDateString('ar-SA')}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{dispute.reason}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-gray-600 dark:text-gray-300">
                        المعلم: {dispute.booking.teacherService.teacher.user.name}
                      </span>
                      <Link href={`/dashboard/disputes/${dispute.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1">
                        فتح المحادثة والبت →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Payouts Section */}
        <section id="payouts" className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              تسويات بانتظار الدفع
            </h2>
            <Link href="/dashboard/admin/payouts" className="text-sm text-blue-600 hover:underline">إدارة التسويات</Link>
          </div>
          <div className="p-4 flex-1">
            {pendingPayouts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
                <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p>جميع مستحقات المعلمين مدفوعة.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayouts.map(payout => (
                  <div key={payout.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{payout.teacher.user.name}</h4>
                      <p className="text-xs text-gray-500">من {payout.periodStart.toLocaleDateString('ar-SA')} إلى {payout.periodEnd.toLocaleDateString('ar-SA')}</p>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{Number(payout.netAmount).toFixed(2)} شيكل</div>
                      <Link href={`/dashboard/admin/payouts/${payout.id}`} className="text-xs text-blue-600 font-medium hover:underline">تحويل وتسديد →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
