import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import TeacherServicesForm from '@/components/shared/TeacherServicesForm';

export default async function TeacherServicesPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.user.id;

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });

  if (!teacher) {
    redirect('/dashboard/teacher');
  }

  // Fetch configured services for this teacher
  const configuredServices = await prisma.teacherService.findMany({
    where: { 
      teacherId: teacher.id, 
      isActive: true,
      serviceType: {
        name: { not: 'الحقيبة الشهرية' }
      }
    },
    select: {
      id: true,
      price: true,
      duration: true,
      customDescription: true,
      serviceType: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Convert prices to numbers to avoid Decimal serialize error in Client Components
  const mappedServices = configuredServices.map((cs) => ({
    id: cs.id,
    price: Number(cs.price),
    duration: cs.duration,
    customDescription: cs.customDescription,
    serviceType: cs.serviceType,
  }));

  // Fetch active system service types
  const serviceTypes = await prisma.serviceType.findMany({
    where: { isActive: true, name: { not: 'الحقيبة الشهرية' } },
    select: { id: true, name: true, defaultDuration: true },
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <TeacherServicesForm
      serviceTypes={serviceTypes}
      configuredServices={mappedServices}
    />
  );
}
