import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { BadgeDollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';

export default async function TeacherEarningsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.user.id;

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });

  if (!teacher) {
    redirect('/dashboard/teacher');
  }

  // 1. Fetch all payouts issued for this teacher
  const payouts = await prisma.teacherPayout.findMany({
    where: { teacherId: teacher.id },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Fetch completed bookings that have NOT been aggregated in any payout yet (Pending Settlement)
  const pendingBookings = await prisma.booking.findMany({
    where: {
      teacherService: { teacherId: teacher.id },
      status: 'COMPLETED',
      payoutId: null,
      OR: [
        { paymentStatus: 'PAID' },
        { isTrial: true },
      ],
    },
    include: {
      student: { select: { name: true } },
      teacherService: {
        include: { serviceType: { select: { name: true } } },
      },
    },
    orderBy: { completedAt: 'desc' },
  });

  // Calculate totals
  let pendingAmount = 0;
  let pendingCommission = 0;
  let pendingTrialCompensation = 0;
  let pendingNet = 0;

  for (const b of pendingBookings) {
    const price = Number(b.price);
    if (b.isTrial) {
      pendingTrialCompensation += Number(b.trialCostToPlatform);
    } else {
      pendingAmount += price;
      const commRate = Number(b.appliedCommissionRate);
      pendingCommission += (price * commRate) / 100;
    }
  }

  pendingNet = pendingAmount - pendingCommission + pendingTrialCompensation;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">الأرباح والتسويات المالية</h1>
        <p className="text-xs text-muted-foreground">
          راجع تفاصيل أرباحك الصافية، الحصص التي تنتظر التسوية، وسجل الحوالات المالية المستلمة من إدارة المنصة.
        </p>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-semibold">بانتظار التسوية القادمة</span>
            <span className="text-lg font-extrabold text-foreground">{formatPrice(pendingNet)}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-semibold">التسويات المستلمة</span>
            <span className="text-lg font-extrabold text-foreground">
              {formatPrice(
                payouts
                  .filter((p) => p.isPaid)
                  .reduce((sum, p) => sum + Number(p.netAmount), 0)
              )}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <BadgeDollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-semibold">إجمالي الأرباح الصافية</span>
            <span className="text-lg font-extrabold text-primary">
              {formatPrice(
                pendingNet +
                  payouts
                    .filter((p) => p.isPaid)
                    .reduce((sum, p) => sum + Number(p.netAmount), 0)
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Pending bookings details list */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-extrabold text-base border-b border-border pb-2.5 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            حصص مكتملة تنتظر دورة التسوية ({pendingBookings.length})
          </h2>

          {pendingBookings.length === 0 ? (
            <p className="text-xs text-muted-foreground py-10 text-center">
              لا توجد حصص مكتملة تنتظر التسوية حالياً. سيتم إدراج الحصص بمجرد انتهاء موعدها ورفع تقرير الحصة.
            </p>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/55 text-muted-foreground font-semibold border-b border-border">
                    <th className="p-3">الحصة / الطالب</th>
                    <th className="p-3">تاريخ الانتهاء</th>
                    <th className="p-3">سعر الحصة</th>
                    <th className="p-3">العمولة</th>
                    <th className="p-3 text-left">أرباحك الصافية</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBookings.map((b) => {
                    const price = Number(b.price);
                    const commRate = Number(b.appliedCommissionRate);
                    const commVal = b.isTrial ? 0 : (price * commRate) / 100;
                    const netVal = b.isTrial ? Number(b.trialCostToPlatform) : price - commVal;

                    return (
                      <tr key={b.id} className="border-b border-border last:border-none hover:bg-accent/20">
                        <td className="p-3">
                          <span className="font-bold block text-foreground/80">{b.teacherService.serviceType.name}</span>
                          <span className="text-[10px] text-muted-foreground">الطالب: {b.student.name}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {b.completedAt ? new Date(b.completedAt).toLocaleDateString('ar-EG') : 'غير محدد'}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {b.isTrial ? 'جلسة تجريبية' : formatPrice(price)}
                        </td>
                        <td className="p-3 text-rose-600 dark:text-rose-400">
                          {b.isTrial ? '-' : `-${formatPrice(commVal)} (${commRate}%)`}
                        </td>
                        <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400 text-left">
                          {formatPrice(netVal)}
                          {b.isTrial && <span className="text-[9px] text-purple-600 block">(تعويض تجريبي)</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Issued Payouts list */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-extrabold text-base border-b border-border pb-2.5 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            سجل تسويات الإدارة
          </h2>

          {payouts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-10 text-center">
              لا توجد تسويات مالية مصدرة بعد.
            </p>
          ) : (
            <div className="space-y-3">
              {payouts.map((p) => (
                <div key={p.id} className="p-4 border border-border rounded-xl bg-accent/20 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground/80">تسوية رقم #{p.id.slice(-6)}</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full font-semibold text-[10px]',
                        p.isPaid
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400'
                      )}
                    >
                      {p.isPaid ? 'مستلمة' : 'قيد التحويل'}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>الفترة:</span>
                    <span>
                      {new Date(p.periodStart).toLocaleDateString('ar-EG')} - {new Date(p.periodEnd).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground border-t border-border/50 pt-2 mt-1">
                    <span>المبلغ الصافي:</span>
                    <span className="font-bold text-primary">{formatPrice(Number(p.netAmount))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
