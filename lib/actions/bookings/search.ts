'use server';

import { requireAuth } from '@/lib/require-auth';
import { UserType, BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from '@/lib/types';
import { hoursUntil } from '@/lib/utils/time';
import { getSettingNumber } from '@/lib/settings';

export async function searchAvailableTeachers(input: {
  specialization: string;
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // "HH:MM"
}): Promise<
  ActionResponse<{
    teachers: {
      id: string;
      userId: string;
      slug: string;
      userName: string;
      specialization: string;
      city: string | null;
      profileImageUrl: string | null;
      verificationLevel: string;
      averageRating: number;
      totalReviews: number;
      totalSessions: number;
      yearsOfExperience: number;
      education: string | null;
      bio: string | null;
      services: {
        id: string;
        price: number;
        duration: number;
        serviceTypeName: string;
        serviceTypeNameEnglish: string | null;
      }[];
    }[];
  }>
> {
  try {
    await requireAuth([UserType.PARENT]);

    const { specialization, date, timeSlot } = input;

    if (!specialization || !date || !timeSlot) {
      return { success: false, error: 'يرجى تحديد المادة والتاريخ والوقت' };
    }

    // تحديد يوم الأسبوع من التاريخ المطلوب
    const dateObj = new Date(`${date}T${timeSlot}:00`);
    if (isNaN(dateObj.getTime())) {
      return { success: false, error: 'التاريخ أو الوقت غير صالح' };
    }

    // التحقق من أن الوقت المطلوب في المستقبل
    const minLeadHours = await getSettingNumber('MinBookingLeadHours', 2);
    if (hoursUntil(dateObj) < minLeadHours) {
      return {
        success: false,
        error: `يجب أن يكون الموعد بعد ${minLeadHours} ساعات على الأقل من الآن`,
      };
    }

    const dayOfWeek = dateObj.getDay(); // 0 = Sunday ... 6 = Saturday

    // 1. جلب المعلمين الموثقين بنفس التخصص مع أوقات توفرهم وخدماتهم
    const teachers = await prisma.teacher.findMany({
      where: {
        isVerified: true,
        specialization,
      },
      include: {
        user: { select: { name: true } },
        availability: {
          where: {
            dayOfWeek,
            isActive: true,
          },
        },
        services: {
          where: { isActive: true, serviceType: { name: { not: 'الحقيبة الشهرية' } } },
          include: {
            serviceType: {
              select: { name: true, nameEnglish: true, defaultDuration: true },
            },
          },
        },
      },
    });

    // 2. تصفية المعلمين الذين لديهم فترة توفر تغطي الوقت المطلوب
    const candidateTeachers = teachers.filter((teacher) => {
      if (teacher.services.length === 0) return false;

      const minDuration = Math.min(...teacher.services.map((s) => s.duration));
      const requestedEndTime = new Date(dateObj.getTime() + minDuration * 60_000);
      const requestedEndStr = `${String(requestedEndTime.getHours()).padStart(2, '0')}:${String(requestedEndTime.getMinutes()).padStart(2, '0')}`;

      return teacher.availability.some(
        (a) => a.startTime <= timeSlot && a.endTime >= requestedEndStr
      );
    });

    const availableTeachers = [];

    if (candidateTeachers.length > 0) {
      const candidateTeacherIds = candidateTeachers.map((t) => t.id);

      // 3. التحقق من عدم وجود تداخل مع حجوزات موجودة (استعلام واحد مجمّع لتجنب N+1 Queries)
      const dayStart = new Date(dateObj);
      dayStart.setHours(dayStart.getHours() - 24);
      const dayEnd = new Date(dateObj);
      dayEnd.setHours(dayEnd.getHours() + 24);

      const allActiveBookings = await prisma.booking.findMany({
        where: {
          teacherService: { teacherId: { in: candidateTeacherIds } },
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          startTime: { gte: dayStart, lte: dayEnd },
        },
        select: {
          startTime: true,
          duration: true,
          teacherService: {
            select: { teacherId: true },
          },
        },
      });

      // تصنيف الحجوزات حسب المعلم في الذاكرة
      const bookingsByTeacher = new Map<string, { startTime: Date; duration: number }[]>();
      for (const booking of allActiveBookings) {
        const tId = booking.teacherService.teacherId;
        if (!bookingsByTeacher.has(tId)) {
          bookingsByTeacher.set(tId, []);
        }
        bookingsByTeacher.get(tId)!.push({
          startTime: booking.startTime,
          duration: booking.duration,
        });
      }

      for (const teacher of candidateTeachers) {
        const minDuration = Math.min(...teacher.services.map((s) => s.duration));
        const activeBookings = bookingsByTeacher.get(teacher.id) || [];

        // التحقق من التداخل مع أقصر مدة خدمة
        const requestedStartMs = dateObj.getTime();
        const requestedEndMs = requestedStartMs + minDuration * 60_000;

        const hasOverlap = activeBookings.some((b) => {
          const otherStartMs = b.startTime.getTime();
          const otherEndMs = otherStartMs + b.duration * 60_000;
          return Math.max(requestedStartMs, otherStartMs) < Math.min(requestedEndMs, otherEndMs);
        });

        if (hasOverlap) continue;

        // المعلم متاح — أضفه للقائمة
        availableTeachers.push({
          id: teacher.id,
          userId: teacher.userId,
          slug: teacher.slug,
          userName: teacher.user.name,
          specialization: teacher.specialization,
          city: teacher.city,
          profileImageUrl: teacher.profileImageUrl,
          verificationLevel: teacher.verificationLevel,
          averageRating: Number(teacher.averageRating),
          totalReviews: teacher.totalReviews,
          totalSessions: teacher.totalSessions,
          yearsOfExperience: teacher.yearsOfExperience,
          education: teacher.education,
          bio: teacher.bio,
          services: teacher.services.map((s) => ({
            id: s.id,
            price: Number(s.price),
            duration: s.duration,
            serviceTypeName: s.serviceType.name,
            serviceTypeNameEnglish: s.serviceType.nameEnglish,
          })),
        });
      }
    }

    return { success: true, data: { teachers: availableTeachers } };
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء البحث';
    return { success: false, error: msg };
  }
}
