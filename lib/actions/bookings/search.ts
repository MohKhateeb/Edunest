"use server";

import { getErrorT } from "@/lib/i18n/get-server-translations";
import { BookingStatus, Currency, UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bookingRepository } from "@/lib/repositories/prisma/booking.repository";
import { requireAuth } from "@/lib/require-auth";
import { getSettingNumber } from "@/lib/settings";
import type { ActionResponse } from "@/lib/types";
import { hoursUntil } from "@/lib/utils/time";

export async function searchAvailableTeachers(input: {
	subjectId: string;
	studentId: string;
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
				currency: Currency;
				duration: number;
				serviceTypeName: string;
				serviceTypeNameEnglish: string | null;
			}[];
		}[];
	}>
> {
    const t = await getErrorT();
	try {
		await requireAuth([UserType.PARENT]);

		const { subjectId, studentId, date, timeSlot } = input;

		if (!subjectId || !studentId || !date || !timeSlot) {
			const t = await getErrorT();
		return { success: false, error: t("search_missing_fields") };
		}

		// جلب بيانات الطالب للتحقق من الصف
		const student = await prisma.student.findUnique({
			where: { id: studentId },
			select: { grade: true },
		});

		if (!student) {
			const t = await getErrorT();
		return { success: false, error: t("search_student_not_found") };
		}

		// تحديد يوم الأسبوع من التاريخ المطلوب
		const dateObj = new Date(`${date}T${timeSlot}:00`);
		if (isNaN(dateObj.getTime())) {
			const t = await getErrorT();
		return { success: false, error: t("search_invalid_datetime") };
		}

		// التحقق من أن الوقت المطلوب في المستقبل
		const minLeadHours = await getSettingNumber("MinBookingLeadHours", 2);
		if (hoursUntil(dateObj) < minLeadHours) {
			return {
				success: false,
				error: t("booking_min_lead_time", { minLeadHours }),
			};
		}

		const dayOfWeek = dateObj.getDay(); // 0 = Sunday ... 6 = Saturday

		// 1. جلب المعلمين الموثقين بنفس التخصص والذين يدرسون صف الطالب، مع أوقات توفرهم وخدماتهم
		const teachers = await prisma.teacher.findMany({
			where: {
				isVerified: true,
				gradeLevels: {
					has: student.grade,
				},
				subjects: {
					some: { subjectId: subjectId },
				},
			},
			include: {
				subjects: { include: { subject: true } },
				user: { select: { name: true } },
				availability: {
					where: {
						dayOfWeek,
						isActive: true,
					},
				},
				services: {
					where: {
						isActive: true,
						serviceType: { isActive: true },
					},
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
			const requestedEndTime = new Date(
				dateObj.getTime() + minDuration * 60_000,
			);
			const requestedEndStr = `${String(requestedEndTime.getHours()).padStart(2, "0")}:${String(requestedEndTime.getMinutes()).padStart(2, "0")}`;

			return teacher.availability.some(
				(a) => a.startTime <= timeSlot && a.endTime >= requestedEndStr,
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

			const allActiveBookings = await bookingRepository.findActiveByTeacherIds(
				candidateTeacherIds,
				dayStart,
				dayEnd
			);

			// تصنيف الحجوزات حسب المعلم في الذاكرة
			const bookingsByTeacher = new Map<
				string,
				{ startTime: Date; duration: number }[]
			>();
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
				const minDuration = Math.min(
					...teacher.services.map((s) => s.duration),
				);
				const activeBookings = bookingsByTeacher.get(teacher.id) || [];

				// التحقق من التداخل مع أقصر مدة خدمة
				const requestedStartMs = dateObj.getTime();
				const requestedEndMs = requestedStartMs + minDuration * 60_000;

				const hasOverlap = activeBookings.some((b) => {
					const otherStartMs = b.startTime.getTime();
					const otherEndMs = otherStartMs + b.duration * 60_000;
					return (
						Math.max(requestedStartMs, otherStartMs) <
						Math.min(requestedEndMs, otherEndMs)
					);
				});

				if (hasOverlap) continue;

				// المعلم متاح — أضفه للقائمة
				availableTeachers.push({
					id: teacher.id,
					userId: teacher.userId,
					slug: teacher.slug,
					userName: teacher.user.name,
					specialization:
						teacher.subjects?.map((s) => s.subject.name).join(", ") ||
						t("search_unspecified", undefined, ) as any,
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
						currency: s.currency,
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
		const t = await getErrorT();
		const msg = err instanceof Error ? err.message : t("search_unexpected_error");
		return { success: false, error: msg };
	}
}
