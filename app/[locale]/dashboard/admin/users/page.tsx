import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminUsersList from "@/app/dashboard/admin/_components/AdminUsersList";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";

export default async function AdminUsersPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const resolvedParams = await searchParams;
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	const cursor = resolvedParams.cursor as string | undefined;
	const { items: users, nextCursor } = await SystemAdminService.getAdminUsers({ cursor });
	// TODO: wire up pagination UI

	return (
		<div className="space-y-6" dir="rtl">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">إدارة مستخدمي المنصة</h1>
				<p className="text-xs text-muted-foreground">
					عرض جميع الحسابات المسجلة في المنصة بمختلف أنواعها، وتعديل حالات
					النشاط وتفاصيل الأبناء التابعين لكل ولي أمر.
				</p>
			</div>

			<AdminUsersList users={users} />
		</div>
	);
}
