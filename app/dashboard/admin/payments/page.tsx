import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminPaymentQueue from '@/components/shared/AdminPaymentQueue';

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  if (session.user.userType !== 'ADMIN') redirect('/unauthorized');

  const pendingPayments = await prisma.payment.findMany({
    where: {
      isPaid: false,
      method: 'BANK_TRANSFER',
      bankTransferProofUrl: { not: null },
    },
    include: {
      booking: {
        select: {
          id: true,
          startTime: true,
          parent: { select: { name: true } },
          student: { select: { name: true } },
          teacherService: {
            select: {
              id: true,
              teacher: {
                select: {
                  user: { select: { name: true } },
                },
              },
              serviceType: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Map to adjust decimal type
  const mappedPayments = pendingPayments.map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    bankTransferProofUrl: p.bankTransferProofUrl,
    createdAt: p.createdAt,
    booking: {
      id: p.booking.id,
      startTime: p.booking.startTime,
      parent: p.booking.parent,
      student: p.booking.student,
      teacherService: {
        serviceType: p.booking.teacherService.serviceType,
        teacher: p.booking.teacherService.teacher,
      },
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">تأكيد الحوالات والمدفوعات اليدوية</h1>
        <p className="text-xs text-muted-foreground">
          راجع إيصالات التحويل البنكي المرفوعة من الأهالي، وطابق القيمة لتأكيد الحجز وتفعيل الجلسات التعليمية.
        </p>
      </div>

      <AdminPaymentQueue payments={mappedPayments} />
    </div>
  );
}
