import { prisma } from '@/lib/prisma';
import { UserType } from '@prisma/client';

export async function getAuthorizedBooking(bookingId: string, userId: string, userType: UserType) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      teacherService: { include: { teacher: true } },
      parent: true,
      payment: true,
    }
  });

  if (!booking) {
    throw new Error('الحجز غير موجود أو غير متاح');
  }

  if (userType === UserType.PARENT && booking.parentUserId !== userId) {
    throw new Error('غير مصرح لك بإجراء تعديلات على هذا الحجز');
  }

  if (userType === UserType.TEACHER && booking.teacherService.teacher.userId !== userId) {
    throw new Error('غير مصرح لك بإجراء تعديلات على هذا الحجز');
  }

  return booking;
}
