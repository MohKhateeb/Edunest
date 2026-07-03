import { UserType } from "@prisma/client";
import { ShieldAlert } from "lucide-react";
import { requireAuth } from "@/lib/require-auth";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";
import AdminDisputesList from "./_components/AdminDisputesList";

export const metadata = {
	title: "إدارة النزاعات | EduNest",
};

export default async function AdminDisputesPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	await requireAuth([UserType.ADMIN]);
	const resolvedParams = await searchParams;

	const cursor = resolvedParams.cursor as string | undefined;
	const { items: disputes, nextCursor } =
		await SystemAdminService.getAdminDisputes({ cursor });

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-600 dark:from-red-400 dark:to-amber-400 flex items-center gap-2">
						<ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
						إدارة النزاعات الشاملة
					</h1>
					<p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
						مراقبة ومعالجة جميع النزاعات بين أولياء الأمور والمعلمين.
					</p>
				</div>
			</div>

			<AdminDisputesList initialData={disputes} />
		</div>
	);
}
