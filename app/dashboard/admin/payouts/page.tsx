import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import AdminPayoutsEngine from '@/components/shared/AdminPayoutsEngine';

export default async function AdminPayoutsPage() {
  await requireAuth([UserType.ADMIN]);


  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const unpaidBookingsRaw = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      payoutId: null,
      completedAt: { lte: twentyFourHoursAgo },
      OR: [{ paymentStatus: 'PAID' }, { isTrial: true }],
    },
    include: {
      teacherService: {
        include: {
          teacher: {
            include: { user: { select: { name: true } } }
          },
          serviceType: { select: { name: true } }
        }
      },
      student: { select: { name: true } },
      dispute: true,
    },
    orderBy: { startTime: 'asc' },
  });

  const unpaidBookings = unpaidBookingsRaw
    .filter(b => !b.dispute || b.dispute.status === 'RESOLVED_IN_FAVOR_OF_TEACHER')
    .map(b => ({
      id: b.id,
      teacherId: b.teacherService.teacherId,
      teacherName: b.teacherService.teacher.user.name || 'غير معروف',
      studentName: b.student.name,
      serviceName: b.teacherService.serviceType.name,
      startTime: b.startTime,
      duration: b.duration,
      price: Number(b.price),
      isTrial: b.isTrial,
      trialCostToPlatform: Number(b.trialCostToPlatform),
      appliedCommissionRate: Number(b.appliedCommissionRate),
    }));

  // Fetch payouts (Limit 50 to prevent OOM)
  const payouts = await prisma.teacherPayout.findMany({
    take: 50,
    include: {
      teacher: {
        select: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const mappedPayouts = payouts.map((p) => ({
    id: p.id,
    totalAmount: Number(p.totalAmount),
    commissionAmount: Number(p.commissionAmount),
    trialCompensation: Number(p.trialCompensation),
    netAmount: Number(p.netAmount),
    isPaid: p.isPaid,
    paidAt: p.paidAt,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    createdAt: p.createdAt,
    teacher: p.teacher,
  }));

  // Fetch parent refunds (Limit 50 to prevent OOM)
  const refunds = await prisma.parentRefund.findMany({
    take: 50,
    include: {
      booking: {
        include: { parent: { select: { name: true } } }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const mappedRefunds = refunds.map((r) => ({
    id: r.id,
    bookingId: r.bookingId,
    parentName: r.booking.parent.name,
    amount: Number(r.amount),
    isPaid: r.isPaid,
    paidAt: r.paidAt,
    createdAt: r.createdAt,
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 p-6 rounded-3xl border border-orange-100 dark:border-orange-900/30">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 mb-2">تسويات المعلمين واستردادات أولياء الأمور</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          قم بتجميع عمولات وحصص كل معلم في المنصة خلال فترات الفوترة، وقم برد المبالغ المستحقة لأولياء الأمور بعد حسم النزاعات لصالحهم.
        </p>
      </div>

      <AdminPayoutsEngine
        unpaidBookings={unpaidBookings}
        existingPayouts={mappedPayouts}
        parentRefunds={mappedRefunds}
      />
    </div>
  );
}
