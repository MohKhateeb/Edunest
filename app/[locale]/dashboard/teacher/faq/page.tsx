import { getTranslations } from "next-intl/server";
import { FAQCategory, UserType } from "@prisma/client";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FAQAccordion from "@/components/shared/FAQAccordion";
import { getFAQs } from "@/lib/actions/faq";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'teachers' });
	return {
		title: t('faq_meta_title'),
		description: t('faq_meta_desc'),
	};
}

export default async function TeacherFAQPage() {
    const t = await getTranslations('teachers')
	const session = await auth();
	await requireAuth([UserType.TEACHER]);
	if (!session) redirect("/login");

	const res = await getFAQs(FAQCategory.TEACHER);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">{t('faq_title')}</h1>
				<p className="text-xs text-muted-foreground">
					{t('faq_subtitle')}
				</p>
			</div>

			{!res.success ? (
				<div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
					{res.error || t('faq_error_load')}
				</div>
			) : (
				<FAQAccordion faqs={res.data || []} />
			)}
		</div>
	);
}
