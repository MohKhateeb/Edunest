import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminServiceTypesManager from "@/app/dashboard/admin/_components/AdminServiceTypesManager";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";

export const dynamic = "force-dynamic";

export default async function AdminServiceTypesPage() {
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session || session.user.userType !== "ADMIN") {
		redirect("/login");
	}

	const serviceTypes = await SystemAdminService.getAdminServices();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">أنواع الخدمات والتسعير</h1>
				<p className="text-muted-foreground">
					إدارة وإعداد نسب العمولة ومدة وأسعار الفزعة للخدمات المختلفة
				</p>
			</div>

			<AdminServiceTypesManager initialServices={serviceTypes} />
		</div>
	);
}
