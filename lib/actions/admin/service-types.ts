"use server";
import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";
import { UserType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";

export async function updateServiceType(
	id: string,
	data: {
		name: string;
		nameEnglish: string | null;
		defaultDuration: number;
		commissionRate: number;
		fazaaPrice: number | null;
		fazaaDuration: number | null;
		isActive: boolean;
	},
): Promise<ActionResponse<void>> {
    const t = await getErrorT();
	try {
		// 1. Security Check: Admin Only
		await requireAuth([UserType.ADMIN]);

		// 2. Validate basic logic
		if (data.defaultDuration < 5)
			return { success: false, error: t("action_error_10") };
		if (data.commissionRate < 0 || data.commissionRate > 100)
			return { success: false, error: t("action_error_11") };

		// 3. Update in Database
		await prisma.serviceType.update({
			where: { id },
			data: {
				name: data.name,
				nameEnglish: data.nameEnglish,
				defaultDuration: data.defaultDuration,
				commissionRate: data.commissionRate,
				fazaaPrice: data.fazaaPrice,
				fazaaDuration: data.fazaaDuration,
				isActive: data.isActive,
			},
		});

		// 4. Revalidate cache
		revalidatePath("/dashboard/admin/services");
		revalidatePath("/dashboard/parent/live");

		return { success: true };
	} catch (error: unknown) {
		console.error("Update ServiceType Error:", error);
		return { success: false, error: t("action_error_12") };
	}
}

export async function toggleServiceTypeStatus(
	id: string,
	currentStatus: boolean,
): Promise<ActionResponse<void>> {
    const t = await getErrorT();
	try {
		await requireAuth([UserType.ADMIN]);

		await prisma.serviceType.update({
			where: { id },
			data: { isActive: !currentStatus },
		});

		revalidatePath("/dashboard/admin/services");
		revalidatePath("/dashboard/parent/live");

		return { success: true };
	} catch (error: unknown) {
		console.error("Toggle ServiceType Status Error:", error);
		return { success: false, error: t("action_error_13") };
	}
}
