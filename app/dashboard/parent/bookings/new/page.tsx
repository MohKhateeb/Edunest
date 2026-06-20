import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import NewBookingPage from '@/components/shared/NewBookingPage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewBookingPageRoute() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.user.id;

  // 1. Fetch parent's active students list
  const students = await prisma.student.findMany({
    where: { parentUserId: userId, isActive: true },
    select: { id: true, name: true, grade: true },
    orderBy: { name: 'asc' },
  });

  // 2. Fetch parent user to check free trial status
  const parentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasUsedFreeTrial: true },
  });

  // 3. Fetch active verified teachers with their services, active schedule availability, and scheduled bookings (to prevent overlap)
  const teachers = await prisma.teacher.findMany({
    where: { 
      isVerified: true,
      user: { isActive: true }
    },
    select: {
      id: true,
      userId: true,
      slug: true,
      profileImageUrl: true,
      user: {
        select: { name: true },
      },
      services: {
        where: { isActive: true, serviceType: { name: { not: 'الحقيبة الشهرية' } } },
        select: {
          id: true,
          price: true,
          duration: true,
          serviceType: {
            select: { id: true, name: true, nameEnglish: true, defaultDuration: true },
          },
        },
      },
      availability: {
        where: { isActive: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
      reviews: {
        select: { rating: true },
      },
    },
    orderBy: { user: { name: 'asc' } },
  });

  // Fetch all scheduled bookings (PENDING or CONFIRMED) for these teachers to prevent overlaps
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      startTime: { gte: new Date() },
    },
    select: {
      startTime: true,
      duration: true,
      teacherService: {
        select: { teacherId: true },
      },
    },
  });

  // Inject bookings to respective teacher profiles in memory
  const teachersWithBookings = teachers.map((t) => {
    const tutorBookings = bookings
      .filter((b) => b.teacherService.teacherId === t.id)
      .map((b) => ({
        startTime: b.startTime,
        duration: b.duration,
      }));

    return {
      id: t.id,
      userId: t.userId,
      slug: t.slug,
      profileImageUrl: t.profileImageUrl,
      user: { name: t.user.name },
      services: t.services.map((s) => ({
        id: s.id,
        price: Number(s.price),
        duration: s.duration,
        serviceType: s.serviceType,
      })),
      availability: t.availability,
      bookings: tutorBookings,
    };
  });

  // 4. جلب التخصصات الفريدة للمعلمين الموثقين (للبحث بالوقت)
  const uniqueSpecsResult = await prisma.teacher.findMany({
    where: { 
      isVerified: true,
      user: { isActive: true }
    },
    select: { specialization: true },
    distinct: ['specialization'],
    orderBy: { specialization: 'asc' },
  });
  const uniqueSpecializations = uniqueSpecsResult.map((t) => t.specialization);

  // 5. جلب أنواع الخدمات المتاحة للطلبات العامة
  const serviceTypes = await prisma.serviceType.findMany({
    where: { isActive: true },
    select: { id: true, name: true, nameEnglish: true, defaultDuration: true },
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <NewBookingPage
      students={students}
      teachers={teachersWithBookings}
      hasUsedTrial={parentUser?.hasUsedFreeTrial ?? false}
      specializations={uniqueSpecializations}
      serviceTypes={serviceTypes}
    />
  );
}
