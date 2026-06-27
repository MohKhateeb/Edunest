"use server";

import { Prisma, UserType } from "@prisma/client";
import { requireTeacherProfile } from "@/lib/actions/auth-helpers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";
import { sanitizePrismaData } from "@/lib/utils";

export type EntityType = "student" | "teacher" | "booking" | "payout";

function successResponse<T>(data: T): ActionResponse<T> {
	return { success: true, data: sanitizePrismaData(data) as T };
}

export const commonStudentInclude = {
	parent: { select: { id: true, name: true, email: true, phone: true } },
	bookings: {
		include: {
			teacherService: {
				include: {
					serviceType: true,
					teacher: { include: { user: { select: { name: true } } } },
				},
			},
			report: true,
			review: true,
		},
		orderBy: { startTime: "desc" as const },
	},
};

async function getStudentDetails(
	entityId: string,
	userId: string,
	userType: UserType,
): Promise<ActionResponse<unknown>> {
	if (userType === UserType.PARENT) {
		const student = await prisma.student.findUnique({
			where: { id: entityId },
			include: commonStudentInclude,
		});

		if (!student) return { success: false, error: "الطالب المطلوب غير موجود." };
		if (student.parentUserId !== userId)
			return {
				success: false,
				error: "غير مصرح لك بمشاهدة تفاصيل هذا الطالب.",
			};
		return successResponse(student);
	}

	if (userType === UserType.TEACHER) {
		const teacher = await requireTeacherProfile(userId);
		const student = await prisma.student.findUnique({
			where: { id: entityId },
			include: {
				...commonStudentInclude,
				bookings: {
					...commonStudentInclude.bookings,
					where: { teacherService: { teacherId: teacher.id } }, // Only fetch teacher's bookings to avoid overfetching
				},
			},
		});

		if (!student) return { success: false, error: "الطالب المطلوب غير موجود." };
		if (student.bookings.length === 0)
			return {
				success: false,
				error:
					"غير مصرح لك بالاطلاع على هذا الطالب لعدم وجود حجوزات مشتركة بينكما.",
			};
		return successResponse(student);
	}

	if (userType === UserType.ADMIN) {
		const student = await prisma.student.findUnique({
			where: { id: entityId },
			include: commonStudentInclude,
		});
		if (!student) return { success: false, error: "الطالب المطلوب غير موجود." };
		return successResponse(student);
	}

	return { success: false, error: "نوع الحساب غير مصرح له بالوصول." };
}

export const commonTeacherInclude = {
	user: { select: { id: true, name: true, email: true, phone: true } },
	services: {
		where: {
			isActive: true,
			serviceType: { isActive: true },
		},
		include: { serviceType: true },
	},
	reviews: {
		where: { isVisible: true },
		orderBy: { createdAt: "desc" as const },
		take: 15,
		include: {
			booking: { select: { student: { select: { name: true } } } },
		},
	},
	verification: true,
	subjects: { include: { subject: true } },
} satisfies Prisma.TeacherInclude;

async function getTeacherDetails(
	entityId: string,
	userId: string,
	userType: UserType,
): Promise<ActionResponse<unknown>> {
	const teacher = await prisma.teacher.findUnique({
		where: { id: entityId },
		include: commonTeacherInclude,
	});

	if (!teacher) return { success: false, error: "المعلم المطلوب غير موجود." };

	if (userType !== "ADMIN" && teacher.userId !== userId) {
		const { verification, ...secureTeacher } = teacher;
		return successResponse({
			...secureTeacher,
			user: { ...teacher.user, phone: null },
		});
	}

	return successResponse(teacher);
}

async function getBookingDetails(
	entityId: string,
	userId: string,
	userType: UserType,
): Promise<ActionResponse<unknown>> {
	const booking = await prisma.booking.findUnique({
		where: { id: entityId },
		include: {
			student: true,
			parent: { select: { id: true, name: true, email: true, phone: true } },
			teacherService: {
				include: {
					serviceType: true,
					teacher: {
						include: {
							user: {
								select: { id: true, name: true, email: true, phone: true },
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

	if (!booking) return { success: false, error: "الحجز المطلوب غير موجود." };

	if (userType === UserType.ADMIN) return successResponse(booking);

	if (userType === UserType.PARENT) {
		if (booking.parentUserId !== userId)
			return { success: false, error: "غير مصرح لك بمشاهدة تفاصيل هذا الحجز." };
		return successResponse(booking);
	}

	if (userType === UserType.TEACHER) {
		if (booking.teacherService.teacher.userId !== userId)
			return {
				success: false,
				error: "غير مصرح لك بمشاهدة تفاصيل حجز خاص بمعلم آخر.",
			};
		return successResponse(booking);
	}

	return { success: false, error: "غير مصرح لك بمشاهدة تفاصيل هذا الحجز." };
}

export const commonPayoutInclude = {
	teacher: {
		include: { user: { select: { id: true, name: true, email: true } } },
	},
	bookings: {
		include: {
			student: { select: { name: true } },
			teacherService: {
				include: { serviceType: { select: { name: true } } },
			},
		},
		orderBy: { startTime: "desc" as const },
	},
} satisfies Prisma.TeacherPayoutInclude;

async function getPayoutDetails(
	entityId: string,
	userId: string,
	userType: UserType,
): Promise<ActionResponse<unknown>> {
	if (userType !== UserType.ADMIN && userType !== UserType.TEACHER) {
		return {
			success: false,
			error: "غير مصرح لك بمشاهدة تفاصيل التسويات المالية.",
		};
	}

	const payout = await prisma.teacherPayout.findUnique({
		where: { id: entityId },
		include: commonPayoutInclude,
	});

	if (!payout)
		return { success: false, error: "التسوية المالية المطلوبة غير موجودة." };
	if (userType === UserType.TEACHER && payout.teacher.userId !== userId)
		return {
			success: false,
			error: "غير مصرح لك بالاطلاع على تسوية مالية خاصة بمعلم آخر.",
		};

	return successResponse(payout);
}

export async function getEntityDetails(
	entityType: EntityType,
	entityId: string,
): Promise<ActionResponse<unknown>> {
	try {
		const { userId, userType } = await requireAuth([
			UserType.PARENT,
			UserType.TEACHER,
			UserType.ADMIN,
		]);

		switch (entityType) {
			case "student":
				return await getStudentDetails(entityId, userId, userType);
			case "teacher":
				return await getTeacherDetails(entityId, userId, userType);
			case "booking":
				return await getBookingDetails(entityId, userId, userType);
			case "payout":
				return await getPayoutDetails(entityId, userId, userType);
			default:
				return { success: false, error: "نوع الكيان المطلوب غير صالح." };
		}
	} catch (err: unknown) {
		console.error(err);
		return {
			success: false,
			error: "حدث خطأ غير متوقع أثناء استرجاع التفاصيل.",
		};
	}
}
