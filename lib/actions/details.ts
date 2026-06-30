"use server";

import { Prisma, UserType } from "@prisma/client";
import { requireTeacherProfile } from "@/lib/actions/auth-helpers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse, EntityType } from "@/lib/types";
import {
	commonPayoutInclude,
	commonStudentInclude,
	commonTeacherInclude,
} from "@/lib/types";
import { sanitizePrismaData } from "@/lib/utils";
import { calculateEarnings } from "@/lib/utils/financial";
import {
	authorizeStudentAccess,
	authorizeBookingAccess,
	authorizePayoutAccess,
	authorizeTeacherProfileAccess,
} from "@/lib/auth/authorization";

function successResponse<T>(data: T): ActionResponse<T> {
	return { success: true, data: sanitizePrismaData(data) as T };
}

function withCalculatedPerformance<T extends { bookings: any[] }>(student: T) {
	const completedReports = student.bookings
		.filter(
			(b: any) => b.status === "COMPLETED" && b.report?.studentPerformance,
		)
		.map((b: any) => b.report.studentPerformance);

	const calculatedAvgPerformance =
		completedReports.length > 0
			? (
					completedReports.reduce((a: number, b: number) => a + b, 0) /
					completedReports.length
				).toFixed(1)
			: null;

	return {
		...student,
		calculatedAvgPerformance,
		calculatedReportsCount: completedReports.length,
	};
}

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
		
		const auth = authorizeStudentAccess(student, userId, userType);
		if (!auth.authorized) return { success: false, error: auth.error };
		return successResponse(withCalculatedPerformance(student));
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
		
		const auth = authorizeStudentAccess(student, userId, userType);
		if (!auth.authorized) return { success: false, error: auth.error };
		return successResponse(withCalculatedPerformance(student));
	}

	if (userType === UserType.ADMIN) {
		const student = await prisma.student.findUnique({
			where: { id: entityId },
			include: commonStudentInclude,
		});
		if (!student) return { success: false, error: "الطالب المطلوب غير موجود." };
		return successResponse(withCalculatedPerformance(student));
	}

	return { success: false, error: "نوع الحساب غير مصرح له بالوصول." };
}

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

	const auth = authorizeTeacherProfileAccess(teacher, userId, userType);
	if (!auth.authorized) {
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

	const auth = authorizeBookingAccess(booking, userId, userType);
	if (!auth.authorized) return { success: false, error: auth.error };

	return successResponse(booking);
}

async function getPayoutDetails(
	entityId: string,
	userId: string,
	userType: UserType,
): Promise<ActionResponse<unknown>> {
	// Basic role check early return (optional, kept from original logic)
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
		
	const auth = authorizePayoutAccess(payout, userId, userType);
	if (!auth.authorized) return { success: false, error: auth.error };

	const hydratedBookings = payout.bookings.map((b) => {
		const earnings = calculateEarnings(
			Number(b.price),
			Number(b.appliedCommissionRate),
			b.isTrial,
			Number(b.trialCostToPlatform),
		);
		return {
			...b,
			calculatedCommission: earnings.commissionAmount,
			calculatedNetAmount: earnings.teacherTotalEarnings,
		};
	});

	return successResponse({ ...payout, bookings: hydratedBookings });
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
