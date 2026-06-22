import { requireAuth } from '@/lib/require-auth';
import { UserType, PaymentStatus, DisputeStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PaymentAction, DisputeAction } from '@/components/shared/FinancialActions';
import { hoursUntil } from '@/lib/utils/time';

export const metadata = {
  title: 'السجل المالي | EduNest',
};

export default async function ParentFinancialsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { userId } = await requireAuth([UserType.PARENT]);
  const resolvedParams = await searchParams;

  const dateFilter = resolvedParams.date as string | undefined;
  const teacherFilter = resolvedParams.teacher as string | undefined;

  let whereClause: any = {
    parentUserId: userId,
  };

  if (dateFilter) {
    const start = new Date(dateFilter);
    const end = new Date(dateFilter);
    end.setHours(23, 59, 59, 999);
    whereClause.createdAt = { gte: start, lte: end };
  }

  if (teacherFilter) {
    whereClause.teacherService = {
      teacher: { userId: teacherFilter },
    };
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      teacherService: {
        include: {
          teacher: { include: { user: true } },
          serviceType: true,
        },
      },
      student: true,
      payment: true,
      dispute: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalSpent = bookings
    .filter((b) => b.paymentStatus === 'PAID')
    .reduce((acc, curr) => acc + Number(curr.price), 0);
    
  const totalRefunded = bookings
    .filter((b) => b.paymentStatus === 'REFUNDED')
    .reduce((acc, curr) => acc + Number(curr.price), 0);

  // Fetch teachers for the filter
  const teachers = await prisma.user.findMany({
    where: { userType: 'TEACHER' },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">السجل المالي</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">تابع جميع مدفوعاتك، واطلع على سجلات الاسترداد والنزاعات.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
          <p className="text-blue-100 font-medium mb-1">إجمالي المدفوعات</p>
          <h3 className="text-4xl font-bold">{totalSpent} <span className="text-lg font-normal opacity-80">شيكل</span></h3>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
          <p className="text-emerald-100 font-medium mb-1">المبالغ المستردة</p>
          <h3 className="text-4xl font-bold">{totalRefunded} <span className="text-lg font-normal opacity-80">شيكل</span></h3>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
        <form className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">التاريخ</label>
            <input 
              type="date" 
              name="date"
              defaultValue={dateFilter}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">المعلم</label>
            <select 
              name="teacher"
              defaultValue={teacherFilter}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">الجميع</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
              تصفية
            </button>
            {(dateFilter || teacherFilter) && (
              <Link href="/dashboard/parent/financials" className="ml-3 text-red-500 text-sm font-medium hover:underline self-center mb-3">
                إلغاء الفلتر
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">التاريخ</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">المعلم / الخدمة</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">الطالب</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">المبلغ</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">حالة الدفع</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">النزاع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">لا توجد حركات مالية مسجلة.</td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {booking.createdAt.toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{booking.teacherService.teacher.user.name}</div>
                      <div className="text-xs text-gray-500">{booking.teacherService.serviceType.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{booking.student.name}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900 dark:text-white">{Number(booking.price)}</span>
                      <span className="text-xs text-gray-500 mr-1">شيكل</span>
                    </td>
                    <td className="px-6 py-4">
                      {booking.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          مدفوع
                        </span>
                      ) : booking.paymentStatus === 'REFUNDED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          مسترد
                        </span>
                      ) : (
                        booking.status === 'PENDING' ? (
                          <PaymentAction bookingId={booking.id} price={Number(booking.price)} />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            غير مدفوع
                          </span>
                        )
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
                            {booking.dispute.status === 'OPEN' ? 'قيد المراجعة' : 'مغلق'}
                          </span>
                          <Link href={`/dashboard/disputes/${booking.dispute.id}`} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors">
                            متابعة النزاع →
                          </Link>
                        </div>
                      ) : (
                        booking.status === 'COMPLETED' && booking.completedAt && hoursUntil(booking.completedAt) >= -24 && !booking.payoutId ? (
                          <DisputeAction bookingId={booking.id} />
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )
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
