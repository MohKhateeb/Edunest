"use server";
import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";
import { type Notification, UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";

export async function getUserNotifications(): Promise<
	ActionResponse<Notification[]>
> {
    const t = await getErrorT();
	try {
		const { userId } = await requireAuth([
			UserType.PARENT,
			UserType.TEACHER,
			UserType.ADMIN,
		]);

		const notifications = await prisma.notification.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			take: 20, // Fetch the latest 20 notifications
		});

		return { success: true, data: notifications };
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return { success: false, error: t("action_error_41") };
	}
}

export async function markNotificationAsRead(
	notificationId: string,
): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		const { userId } = await requireAuth([
			UserType.PARENT,
			UserType.TEACHER,
			UserType.ADMIN,
		]);

		const result = await prisma.notification.updateMany({
			where: { id: notificationId, userId },
			data: { isRead: true },
		});

		if (result.count === 0) {
			return { success: false, error: t("action_error_42") };
		}

		return { success: true };
	} catch (error) {
		console.error("Error marking notification as read:", error);
		return { success: false, error: t("action_error_43") };
	}
}

export async function markAllNotificationsAsRead(): Promise<ActionResponse> {
    const t = await getErrorT();
	try {
		const { userId } = await requireAuth([
			UserType.PARENT,
			UserType.TEACHER,
			UserType.ADMIN,
		]);

		await prisma.notification.updateMany({
			where: { userId, isRead: false },
			data: { isRead: true },
		});

		return { success: true };
	} catch (error) {
		console.error("Error marking all notifications as read:", error);
		return { success: false, error: t("action_error_44") };
	}
}
