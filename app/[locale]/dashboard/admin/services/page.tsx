import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import AdminServiceTypesManager from "../_components/AdminServiceTypesManager";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminServiceTypesPage() {
    const t = await getTranslations('admin')
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session || session.user.userType !== "ADMIN") {
		redirect("/login");
	}

	const serviceTypes = await SystemAdminService.getAdminServices();

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">{t('key_1783109434475_hx4z')}</h1>
				<p className="text-muted-foreground">
					{t('key_1783109434478_yf0l')}</p>
			</div>

			<AdminServiceTypesManager initialServices={serviceTypes} />
		</div>
	);
}
