"use server";

import { RequestStatus, UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import {
	createManyNotifications,
	createNotification,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";
import { tutoringRequestSchema } from "@/lib/validations/tutoring-request";

/**
 * إنشاء طلب فزعة (Instant Help / Live Radar) من ولي الأمر
 */
export async function createTutoringRequest(
	data: z.infer<typeof tutoringRequestSchema>,
): Promise<ActionResponse<{ requestId: string }>> {
	try {
		const { userId: parentUserId } = await requireAuth([UserType.PARENT]);

		const validated = tutoringRequestSchema.safeParse(data);
		if (!validated.success) {
			return { success: false, error: validated.error.issues[0].message };
		}

		const { studentId, subjectId, serviceTypeId, title, details, imageUrl } =
			validated.data;

		// 1. لا نطبق مهلة الحد الأدنى للطلب العام لأنه مخصص للطلبات الفورية (Uber-like)
		// نعين وقت البدء ليكون الآن (باعتباره طلباً عاجلاً)
		const actualStartTime = new Date();

		// 2. التحقق من الطالب وولي أمره
		const student = await prisma.student.findUnique({
			where: { id: studentId, parentUserId, isActive: true },
		});
		if (!student) {
			return {
				success: false,
				error: "الطالب المحدد غير موجود أو غير تابع لك",
			};
		}

		// 3. التحقق من نوع الخدمة
		const serviceType = await prisma.serviceType.findUnique({
			where: { id: serviceTypeId, isActive: true },
		});
		if (!serviceType) {
			return { success: false, error: "نوع الخدمة المطلوب غير متوفر" };
		}

		// 4. إنشاء الطلب العام
		const request = await prisma.tutoringRequest.create({
			data: {
				parentId: parentUserId,
				studentId,
				subjectId,
				serviceTypeId,
				title,
				details,
				imageUrl,
				startTime: actualStartTime,
				duration: serviceType.fazaaDuration ?? 30, // ⚡ سعر ومدة ديناميكية
				price: serviceType.fazaaPrice ?? 50, // ⚡ من الخدمة نفسها
				status: RequestStatus.PENDING,
			},
		});

		// 5. البحث عن المعلمين المتوافقين وإرسال إشعارات لهم
		// الشروط: متاح حالياً، يدرس المادة المطلوبة، يدرس نفس الصف الدراسي للطالب، وموثق
		const matchingTeachers = await prisma.teacher.findMany({
			where: {
				isVerified: true,
				isAvailableNow: true,
				subjects: {
					some: { subjectId: subjectId },
				},
				gradeLevels: { has: student.grade },
				user: { isActive: true },
			},
			select: {
				id: true,
				userId: true,
			},
		});

		const duration = serviceType.fazaaDuration ?? 30;
		const price = serviceType.fazaaPrice ?? 50;

		// إرسال إشعار لكل معلم متطابق بشكل جماعي لتحسين الأداء
		if (matchingTeachers.length > 0) {
			await createManyNotifications(
				matchingTeachers.map((t) => ({
					userId: t.userId,
					title: "⚡ طلب فوري جديد! (Live Radar) 📢",
					message: `طلب عاجل من الطالب (${student.name} - الصف ${student.grade}). الطلب مدفوع مسبقاً (${price} شيكل - ${duration} دقيقة). أسرع والتقط الطلب الآن قبل غيرك!`,
					link: "/dashboard/teacher/live",
				})),
			);
		}

		revalidatePath("/dashboard/parent/live");
		return { success: true, data: { requestId: request.id } };
	} catch (error: unknown) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الطلب",
		};
	}
}
