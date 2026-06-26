import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminSettingsForm from "@/app/dashboard/admin/_components/AdminSettingsForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export default async function AdminSettingsPage() {
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	const settings = await prisma.systemSetting.findMany({
		orderBy: { settingKey: "asc" },
	});

	return <AdminSettingsForm initialSettings={settings} />;
}
