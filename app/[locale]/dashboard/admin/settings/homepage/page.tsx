import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import HomepageSettingsManager from "@/components/admin/homepage/HomepageSettingsManager";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";

export default async function AdminHomepageSettingsPage() {
    const t = await getTranslations('admin')
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	const layoutSetting = await SystemAdminService.getHomepageSettings();

	return (
		<div className="space-y-6">
			<div className="bg-card border border-border rounded-xl p-6 shadow-sm">
				<h1 className="text-2xl font-extrabold text-foreground mb-1">
					{t('homepage_settings_page_title')}</h1>
				<p className="text-xs text-muted-foreground">
					{t('homepage_settings_page_subtitle')}
				</p>
			</div>

			<HomepageSettingsManager
				initialLayoutJson={layoutSetting?.settingValue ?? null}
			/>
		</div>
	);
}
