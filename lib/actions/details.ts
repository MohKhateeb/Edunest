'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { UserType } from '@prisma/client';
import { sanitizePrismaData } from '@/lib/utils';

export type EntityType = 'student' | 'teacher' | 'booking' | 'payout';

function successResponse(data: any): ActionResponse<any> {
  return { success: true, data: sanitizePrismaData(data) };
}

export async function getEntityDetails(
  entityType: EntityType,
  entityId: string
): Promise<ActionResponse<any>> {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً للوصول إلى هذه البيانات.' };
    }

    const { id: userId, userType } = session.user;

    if (entityType === 'student') {
      const student = await prisma.student.findUnique({
        where: { id: entityId },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          bookings: {
            include: {
              teacherService: {
                include: {
                  serviceType: true,
                  teacher: {
                    include: {
                      user: {
                        select: { name: true },
                      },
                    },
                  },
                },
              },
              report: true,
              review: true,
            },
            orderBy: { startTime: 'desc' },
          },
        },
      });

      if (!student) {
        return { success: false, error: 'الطالب المطلوب غير موجود.' };
      }

      // Authorization checks
      if (userType === UserType.ADMIN) {
        return successResponse(student);
      }

      if (userType === UserType.PARENT) {
        if (student.parentUserId !== userId) {
          return { success: false, error: 'غير مصرح لك بمشاهدة تفاصيل هذا الطالب.' };
        }
        return successResponse(student);
      }

      if (userType === UserType.TEACHER) {
        const teacher = await prisma.teacher.findUnique({
          where: { userId },
        });
        if (!teacher) {
          return { success: false, error: 'الملف الشخصي للمعلم غير موجود.' };
        }

        const hasBooking = student.bookings.some(
          (b) => b.teacherService.teacherId === teacher.id
        );

        if (!hasBooking) {
          return { success: false, error: 'غير مصرح لك بالاطلاع على هذا الطالب لعدم وجود حجوزات مشتركة بينكما.' };
        }

        // Teacher can only see bookings associated with themselves for privacy
        const filteredBookings = student.bookings.filter(
          (b) => b.teacherService.teacherId === teacher.id
        );

        return successResponse({
          ...student,
          bookings: filteredBookings,
        });
      }

      return { success: false, error: 'نوع الحساب غير مصرح له بالوصول.' };
    }

    if (entityType === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { id: entityId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          services: {
            where: { isActive: true, serviceType: { name: { not: 'الحقيبة الشهرية' } } },
            include: {
              serviceType: true,
            },
          },
          reviews: {
            where: { isVisible: true },
            orderBy: { createdAt: 'desc' },
            take: 15,
            include: {
              booking: {
                select: {
                  student: {
                    select: { name: true },
                  },
                },
              },
            },
          },
          verification: true,
        },
      });

      if (!teacher) {
        return { success: false, error: 'المعلم المطلوب غير موجود.' };
      }

      // Hide verification details for non-admins and other users
      if (userType !== 'ADMIN' && teacher.userId !== userId) {
        // Parents and other users shouldn't see ID cards or university degrees
        const { verification, ...secureTeacher } = teacher;
        return successResponse({
          ...secureTeacher,
          user: {
            ...teacher.user,
            phone: null, // Hide phone number for privacy except for admins or the teacher themselves
          },
        });
      }

      return successResponse(teacher);
    }

    if (entityType === 'booking') {
      const booking = await prisma.booking.findUnique({
        where: { id: entityId },
        include: {
          student: true,
          parent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          teacherService: {
            include: {
              serviceType: true,
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          payment: true,
          report: true,
          review: true,
        },
      });

      if (!booking) {
        return { success: false, error: 'الحجز المطلوب غير موجود.' };
      }

      // Authorization checks
      if (userType === UserType.ADMIN) {
        return successResponse(booking);
      }

      if (userType === UserType.PARENT) {
        if (booking.parentUserId !== userId) {
          return { success: false, error: 'غير مصرح لك بمشاهدة تفاصيل هذا الحجز.' };
        }
        return successResponse(booking);
      }

      if (userType === UserType.TEACHER) {
        if (booking.teacherService.teacher.userId !== userId) {
          return { success: false, error: 'غير مصرح لك بمشاهدة تفاصيل حجز خاص بمعلم آخر.' };
        }

        // Hide bank transfer proof images from teachers
        const secureBooking = { ...booking };
        if (secureBooking.payment) {
          secureBooking.payment = {
            ...secureBooking.payment,
            bankTransferProofUrl: null,
          };
        }

        return successResponse(secureBooking);
      }

      return { success: false, error: 'نوع الحساب غير مصرح له بالوصول.' };
    }

    if (entityType === 'payout') {
      const payout = await prisma.teacherPayout.findUnique({
        where: { id: entityId },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          bookings: {
            include: {
              student: { select: { name: true } },
              teacherService: {
                include: {
                  serviceType: { select: { name: true } },
                },
              },
            },
            orderBy: { startTime: 'desc' },
          },
        },
      });

      if (!payout) {
        return { success: false, error: 'التسوية المالية المطلوبة غير موجودة.' };
      }

      // Authorization checks
      if (userType === UserType.ADMIN) {
        return successResponse(payout);
      }

      if (userType === UserType.TEACHER) {
        if (payout.teacher.userId !== userId) {
          return { success: false, error: 'غير مصرح لك بالاطلاع على تسوية مالية خاصة بمعلم آخر.' };
        }
        return successResponse(payout);
      }

      return { success: false, error: 'غير مصرح لك بمشاهدة تفاصيل التسويات المالية.' };
    }

    return { success: false, error: 'نوع الكيان المطلوب غير صالح.' };
  } catch (err: unknown) {
    console.error(err);
    return { success: false, error: 'حدث خطأ غير متوقع أثناء استرجاع التفاصيل.' };
  }
}
