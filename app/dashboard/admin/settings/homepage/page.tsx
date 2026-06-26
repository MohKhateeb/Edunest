import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import HomepageLayoutForm from "@/components/shared/HomepageLayoutForm";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export default async function AdminHomepageSettingsPage() {
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	const layoutSetting = await prisma.systemSetting.findUnique({
		where: { settingKey: "HomepageLayout" },
	});

	return (
		<div className="space-y-6">
			<div className="bg-card border border-border rounded-xl p-6 shadow-sm">
				<h1 className="text-2xl font-extrabold text-foreground mb-1">
					تخطيط وأقسام الصفحة الرئيسية
				</h1>
				<p className="text-xs text-muted-foreground">
					أعد ترتيب الأقسام، قم بإخفاء أو إظهار أي قسم، عدل العناوين والمحتويات،
					أو أضف أقساماً جديدة مخصصة بالكامل.
				</p>
			</div>

			<HomepageLayoutForm
				initialLayoutJson={layoutSetting?.settingValue ?? null}
			/>
		</div>
	);
}
