"use server";

import { RequestStatus, UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";

/**
 * فحص حالة طلب الفزعة للتحقق مما إذا كان المعلم قد التقطه
 * يقوم بإرجاع رقم الحجز في حال تم الالتقاط ليتم توجيه الولي للوبي
 */
export async function checkLiveRequestMatch(
	requestId: string,
): Promise<ActionResponse<{ isMatched: boolean; bookingId?: string }>> {
	try {
		const { userId: parentUserId } = await requireAuth([UserType.PARENT]);

		const request = await prisma.tutoringRequest.findUnique({
			where: { id: requestId },
			select: { status: true, title: true, parentId: true },
		});

		if (!request || request.parentId !== parentUserId) {
			return { success: false, error: "الطلب غير موجود" };
		}

		if (request.status === RequestStatus.ACCEPTED) {
			// بما أن الطلب مقبول، نبحث عن الحجز الذي تم إنشاؤه للتو (نفس عنوان السؤال ولنفس الولي)
			const booking = await prisma.booking.findFirst({
				where: {
					parentUserId: parentUserId,
					questionTitle: request.title,
					status: "PENDING", // الحجز الفوري يبدأ كـ PENDING بانتظار الدفع
				},
				orderBy: { createdAt: "desc" },
			});

			if (booking) {
				return {
					success: true,
					data: { isMatched: true, bookingId: booking.id },
				};
			}
		}

		return { success: true, data: { isMatched: false } };
	} catch (error: unknown) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "حدث خطأ أثناء الفحص",
		};
	}
}
