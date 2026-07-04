import { getTranslations } from "next-intl/server";
import { FAQCategory, UserType } from "@prisma/client";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FAQAccordion from "@/components/shared/FAQAccordion";
import NajeebCharacter from "@/components/shared/NajeebCharacter";
import { getFAQs } from "@/lib/actions/faq";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'parent' });
	return {
		title: t('key_1783109435564_5v7o'),
		description: t('key_1783109435565_p510'),
	};
}

export default async function ParentFAQPage() {
    const t = await getTranslations('parent')
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session) redirect("/login");

	const res = await getFAQs(FAQCategory.PARENT);

	return (
		<div className="space-y-6 text-start">
			<div className="border-b border-border/40 pb-4">
				<h1 className="text-2xl font-black mb-1">{t('key_1783109435561_o60u')}</h1>
				<p className="text-xs text-muted-foreground">
					تجد هنا إجابات لأكثر الأسئلة شيوعاً حول استخدام المنصة، الحجوزات،
					والمدفوعات الخاصة بأولياء الأمور.
				</p>
			</div>

			{!res.success ? (
				<div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl border border-red-200/50">
					{res.error || t('key_1783109435567_70fa')}
				</div>
			) : (
				<div className="bg-card border border-border/80 rounded-3xl p-6 shadow-premium relative overflow-visible mt-12">
					{/* نجيب يخرج رأسه من خلف بطاقة الأسئلة الشائعة (ثابت بدون حركة) */}
					<div className="absolute -top-14 end-6 z-0">
						<NajeebCharacter mode="help" size="sm" animated={false} />
					</div>
					<div className="relative z-10">
						<FAQAccordion faqs={res.data || []} />
					</div>
				</div>
			)}
		</div>
	);
}
