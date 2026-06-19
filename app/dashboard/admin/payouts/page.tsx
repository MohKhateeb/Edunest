import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminPayoutsEngine from '@/components/shared/AdminPayoutsEngine';

export default async function AdminPayoutsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  if (session.user.userType !== 'ADMIN') redirect('/unauthorized');

  // Fetch teachers
  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      user: { select: { name: true } },
    },
    orderBy: { user: { name: 'asc' } },
  });

  const teacherOptions = teachers.map((t) => ({
    id: t.id,
    name: t.user.name,
  }));

  // Fetch payouts
  const payouts = await prisma.teacherPayout.findMany({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">تسويات مستحقات المعلمين</h1>
        <p className="text-xs text-muted-foreground">
          قم بتجميع عمولات وحصص كل معلم في المنصة خلال فترات الفوترة، ثم تأكيد تحويل الأرباح الصافية للبنوك.
        </p>
      </div>

      <AdminPayoutsEngine
        teachers={teacherOptions}
        existingPayouts={mappedPayouts}
      />
    </div>
  );
}
