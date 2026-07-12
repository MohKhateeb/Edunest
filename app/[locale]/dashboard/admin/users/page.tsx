import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminPaginationControls from "@/components/shared/AdminPaginationControls";
import AdminUsersList from "../_components/AdminUsersList";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";

export default async function AdminUsersPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const t = await getTranslations('admin')
	const resolvedParams = await searchParams;
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	const cursor = resolvedParams.cursor as string | undefined;
	const { items: users, nextCursor } = await SystemAdminService.getAdminUsers({ cursor });

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">{t('users_page_title')}</h1>
				<p className="text-xs text-muted-foreground">
					{t('users_page_subtitle')}
				</p>
			</div>

			<AdminUsersList users={users} />
			<AdminPaginationControls nextCursor={nextCursor} hasCursor={!!cursor} />
		</div>
	);
}
