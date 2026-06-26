import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AvailabilityForm from '@/components/shared/AvailabilityForm';
import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';

export default async function TeacherAvailabilityPage() {
  const session = await auth();
  await requireAuth([UserType.TEACHER]);
  if (!session) redirect('/login');

  const userId = session.user.id;

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });

  if (!teacher) {
    redirect('/dashboard/teacher');
  }

  const availability = await prisma.teacherAvailability.findMany({
    where: { teacherId: teacher.id, isActive: true },
    select: { dayOfWeek: true, startTime: true, endTime: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  return <AvailabilityForm initialAvailability={availability} />;
}
