import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFAQs } from "@/lib/actions/faq";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import FAQAdminClient from "./FAQAdminClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'admin' });
	return {
		title: t('key_1783109433867_avvh'),
		description: t('key_1783109433867_5hfw'),
	};
}

export default async function AdminFAQPage() {
    const t = await getTranslations('admin')
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	const res = await getFAQs(undefined, true);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">{t('key_1783109433863_kzwq')}</h1>
				<p className="text-xs text-muted-foreground">
					يمكنك هنا إضافة، تعديل، وحذف الأسئلة الشائعة الخاصة بأولياء الأمور،
					المعلمين، والإدارة.
				</p>
			</div>

			{!res.success ? (
				<div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
					{res.error || t('key_1783109433867_xdxs')}
				</div>
			) : (
				<FAQAdminClient initialFaqs={res.data || []} />
			)}
		</div>
	);
}
