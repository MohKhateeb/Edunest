import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ParentLiveRadarClient from '@/components/shared/ParentLiveRadarClient';

export const dynamic = 'force-dynamic';

export default async function ParentLiveRadarPage() {
  const session = await auth();
  if (!session || session.user.userType !== 'PARENT') {
    redirect('/login');
  }

  // Fetch students for this parent
  const students = await prisma.student.findMany({
    where: { parentUserId: session.user.id, isActive: true },
    select: { id: true, name: true, grade: true }
  });

  if (students.length === 0) {
    redirect('/dashboard/profile');
  }

  // Fetch service types (we need the "Quick Help" / "شرح مسألة سريعة" service ID)
  const serviceTypes = await prisma.serviceType.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  });

  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-6" dir="rtl">
      <ParentLiveRadarClient students={students} serviceTypes={serviceTypes} subjects={subjects} />
    </div>
  );
}
