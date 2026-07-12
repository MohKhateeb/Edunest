import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminPaginationControls from "@/components/shared/AdminPaginationControls";
import AdminTeachersList from "../_components/AdminTeachersList";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";

export default async function AdminTeachersPage({
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
	const { items: teachers, nextCursor } = await SystemAdminService.getAdminTeachers({ cursor });

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">{t('key_1783109434502_p5vd')}</h1>
				<p className="text-muted-foreground">{t('key_1783109434509_weot')}</p>
			</div>

			<AdminTeachersList teachers={teachers} />
			<AdminPaginationControls nextCursor={nextCursor} hasCursor={!!cursor} />
		</div>
	);
}
