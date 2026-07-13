import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'legal'});
  return {
    title: t('legal_terms_page_title'),
    description: t('terms_meta_description'),
  };
}

const getSections = (t: Awaited<ReturnType<typeof getTranslations>>) => [
	{
		title: t('legal_terms_section_1_heading') ,
		content: t('legal_terms_agreement_intro'),
	},
	{
		title: t('legal_terms_section_2_heading') ,
		content: t('legal_terms_platform_description'),
	},
	{
		title: t('legal_terms_section_3_heading') ,
		content: `لاستخدام المنصة يجب أن:
• تكون مقيماً في الضفة الغربية أو تتعامل مع طلاب فيها.
• تكون بعمر ١٨ عاماً أو أكثر (أو بموافقة ولي الأمر للقاصرين).
• تقديم معلومات صحيحة ودقيقة عند التسجيل.
• الحفاظ على سرية بيانات الدخول وعدم مشاركتها مع أي شخص.`,
	},
	{
		title: t('legal_terms_section_4_heading') ,
		content: `يوافق المعلم المسجّل على:
• تقديم وثائق هوية وشهادات أكاديمية صحيحة للتحقق منها.
• الحضور في المواعيد المحجوزة والإبلاغ المسبق عن أي تعذّر.
• الالتزام بالأخلاقيات المهنية والسلوك اللائق مع الطلاب وأولياء الأمور.
• قبول سياسة العمولة المتفق عليها على كل جلسة مكتملة.
• كتابة تقرير جلسة مفصّل بعد كل حصة خلال ٢٤ ساعة من انتهائها.`,
	},
	{
		title: t('legal_terms_section_5_heading') ,
		content: `تسري قواعد الحجز والإلغاء التالية:
• يُعتبر الحجز مؤكداً بعد قبول المعلم ودفع الرسوم المقررة.
• إلغاء الحجز قبل ٢٤ ساعة: استرداد كامل المبلغ.
• إلغاء الحجز بعد ٢٤ ساعة وقبل موعد الجلسة: استرداد ٥٠٪ من المبلغ.
• عدم الحضور دون إشعار مسبق: لا يُستردّ أي مبلغ.
• إذا ألغى المعلم الجلسة، يُردّ المبلغ كاملاً لولي الأمر تلقائياً.`,
	},
	{
		title: t('legal_terms_section_6_heading') ,
		content: t('legal_terms_free_trial_policy'),
	},
	{
		title: t('legal_terms_section_7_heading') ,
		content: `• تُحدَّد الأسعار من قبل كل معلم بالشيكل الإسرائيلي (₪).
• تقتطع إديونست عمولة متفق عليها من قيمة كل جلسة مكتملة.
• يحق للمعلم طلب تسوية مستحقاته عبر لوحة تحكم الأرباح.
• تقبل المنصة الدفع نقداً، أو بالتحويل البنكي مع رفع إيصال التحويل.
• يتم تأكيد الدفع من قِبل الإدارة خلال يوم عمل واحد.`,
	},
	{
		title: t('legal_terms_section_8_heading') ,
		content: `يُحظر على جميع المستخدمين:
• نشر أي محتوى مسيء أو مضلل أو غير قانوني.
• محاولة الاتصال بالمعلمين خارج المنصة لتجاوز رسوم الخدمة.
• استخدام المنصة لأي غرض غير تعليمي أو مخالف للقانون.
• انتهاك خصوصية المستخدمين الآخرين أو مضايقتهم.`,
	},
	{
		title: t('legal_terms_section_9_heading') ,
		content: t('legal_terms_liability_disclaimer_text'),
	},
	{
		title: t('legal_terms_section_10_heading') ,
		content: t('legal_terms_account_suspension_policy'),
	},
	{
		title: t('legal_terms_section_11_heading') ,
		content:
			"لأي استفسار أو شكوى، تواصل معنا عبر: support@edunest.ps\nنسعى إلى الرد على جميع الاستفسارات خلال ٢٤ ساعة من أيام العمل.",
	},
];

export default async function TermsPage() {
    const t = await getTranslations('legal')
	return (
		<div className="min-h-screen flex flex-col">
			<Header />

			<section className="bg-gradient-to-br from-[hsl(172,66%,10%)] via-[hsl(172,60%,18%)] to-[hsl(200,50%,14%)] text-white py-14">
				<div className="max-w-4xl mx-auto px-6 text-center">
					<h1 className="text-4xl font-extrabold mb-3">{t('legal_terms_heading')}</h1>
					<p className="text-white/70">{t('legal_terms_last_updated_label')}</p>
				</div>
			</section>

			<main className="flex-1 py-12 bg-muted/20">
				<div className="max-w-4xl mx-auto px-6 space-y-6">
					<div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-5">
						<p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
							{t('legal_terms_reading_notice')}
						</p>
					</div>

					{getSections(t).map((section, i) => (
						<div
							key={i}
							className="bg-card border border-border rounded-2xl p-6 md:p-8"
						>
							<h2 className="text-xl font-bold mb-4 text-primary">
								{section.title}
							</h2>
							<p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
								{section.content}
							</p>
						</div>
					))}
				</div>
			</main>

			<Footer />
		</div>
	);
}
