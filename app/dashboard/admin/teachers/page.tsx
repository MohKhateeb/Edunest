import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminTeachersList from "@/app/dashboard/admin/_components/AdminTeachersList";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";

export default async function AdminTeachersPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const resolvedParams = await searchParams;
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	const cursor = resolvedParams.cursor as string | undefined;
	const { items: teachers, nextCursor } = await SystemAdminService.getAdminTeachers({ cursor });
	// TODO: wire up pagination UI

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">إدارة معلمي المنصة</h1>
				<p className="text-muted-foreground">استعرض وقم بإدارة المعلمين</p>
			</div>

			<AdminTeachersList teachers={teachers} />
		</div>
	);
}
