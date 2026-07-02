import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminSettingsForm from "@/app/dashboard/admin/_components/AdminSettingsForm";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";

export default async function AdminSettingsPage() {
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	const { rawSettings, groupedSettings } =
		await SystemAdminService.getSystemSettings();

	return (
		<AdminSettingsForm
			initialSettings={rawSettings}
			groupedSettings={groupedSettings}
		/>
	);
}
