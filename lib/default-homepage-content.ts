import type { HomepageContent } from "@/types/homepage";

export function getDefaultHomepageContent(t: (key: string) => string): HomepageContent {
	return {
		announcementBanner: {
			isActive: true,
			text: t("announcement_text"),
			link: "/register",
			backgroundColor: "bg-primary",
			textColor: "text-white",
		},
		hero: {
			badge: t("hero_badge"),
			badgeMessage: t("hero_badge_message"),
			headline: t("hero_headline"),
			highlightedWord: t("hero_highlighted_word"),
			subheadline: t("hero_subheadline"),
			primaryBtnText: t("hero_primary_btn_text"),
			primaryBtnLink: "/register",
			secondaryBtnText: t("hero_secondary_btn_text"),
			secondaryBtnLink: "/teachers",
			character1Message: t("hero_character1_message"),
			character2Message: t("hero_character2_message"),
		},
		persuasion: {
			title: t("persuasion_title"),
			subtitle: t("persuasion_subtitle"),
			hakeemTag: t("persuasion_hakeem_tag"),
			hakeemQuote: t("persuasion_hakeem_quote"),
			najeebTag: t("persuasion_najeeb_tag"),
			najeebQuote: t("persuasion_najeeb_quote"),
		},
		journey: {
			title: t("journey_title"),
			subtitle: t("journey_subtitle"),
			steps: [
				{
					title: t("journey_step1_title"),
					description: t("journey_step1_desc"),
				},
				{
					title: t("journey_step2_title"),
					description: t("journey_step2_desc"),
				},
				{
					title: t("journey_step3_title"),
					description: t("journey_step3_desc"),
				},
				{
					title: t("journey_step4_title"),
					description: t("journey_step4_desc"),
				},
			],
		},
		assurance: {
			title: t("assurance_title"),
			subtitle: t("assurance_subtitle"),
			features: [
				{
					iconName: "ShieldCheck",
					title: t("assurance_feature1_title"),
					description: t("assurance_feature1_desc"),
				},
				{
					iconName: "Video",
					title: t("assurance_feature2_title"),
					description: t("assurance_feature2_desc"),
				},
				{
					iconName: "CreditCard",
					title: t("assurance_feature3_title"),
					description: t("assurance_feature3_desc"),
				},
				{
					iconName: "MessageCircle",
					title: t("assurance_feature4_title"),
					description: t("assurance_feature4_desc"),
				},
			],
		},
		footerCta: {
			title: t("footer_cta_title"),
			subtitle: t("footer_cta_subtitle"),
			btnText: t("footer_cta_btn_text"),
			btnLink: "/register",
		},
	};
}

export const defaultHomepageContent: HomepageContent = {
	announcementBanner: {
		isActive: true,
		text: "عرض خاص بمناسبة العودة للمدارس! احصل على خصم 20% على الجلسة الأولى.",
		link: "/register",
		backgroundColor: "bg-primary",
		textColor: "text-white",
	},
	hero: {
		badge: "جديد",
		badgeMessage: "طريقة جديدة وأمتع للتعلم ✨",
		headline: "كل عقل نير، يحتاج إلى",
		highlightedWord: "دليل مخلص",
		subheadline:
			"وهنا في إديونست، جعلنا رحلة البحث عن هذا الدليل أسهل وأمتع. انضم إلينا واكتشف متعة التعلم المخصص.",
		primaryBtnText: "ابدأ رحلة التعلم معنا",
		primaryBtnLink: "/register",
		secondaryBtnText: "استكشف المعلمين",
		secondaryBtnLink: "/teachers",
		character1Message: "التعلم يبدأ هنا!",
		character2Message: "مستعد للتفوق؟ 🚀",
	},
	persuasion: {
		title: "لماذا يثق بنا الآباء ويحبنا الطلاب؟",
		subtitle: "دعنا نستمع لما يقوله حكيم ونجيب...",
		hakeemTag: "نصيحة حكيم",
		hakeemQuote:
			'"يا بني، الوقت هو أثمن ما نملكه. والتعليم الفردي المخصص يختصر المسافات، يركز على نقاط الضعف، ويبني الثقة بالنفس بشكل أسرع بكثير من الطرق التقليدية."',
		najeebTag: "رأي نجيب",
		najeebQuote:
			'"صحيح جداً! وأفضل ما في الأمر أنني أستطيع اختيار المعلم الذي يفهمني، في الوقت الذي يناسبني تماماً دون أن أضطر لتغيير جدول يومي المليء بالأنشطة."',
	},
	journey: {
		title: "رحلة التعلم معنا بسيطة وواضحة",
		subtitle: "أربع خطوات تفصلك عن تجربة تعليمية متميزة",
		steps: [
			{
				title: "ابحث عن المعلم المناسب",
				description:
					"تصفح ملفات المعلمين الموثقين وتعرف على تخصصاتهم وأسلوبهم.",
			},
			{
				title: "احجز جلستك الأولى",
				description: "اختر الوقت المناسب لك من جدول المعلم المتاح وادفع بأمان.",
			},
			{
				title: "تعلم وتفاعل",
				description: "انضم للجلسة التفاعلية المباشرة وابدأ التعلم المخصص لك.",
			},
			{
				title: "تطور وتقدم",
				description: "تابع تقدمك واحصل على تقارير دورية واضمن تفوقك الدراسي.",
			},
		],
	},
	assurance: {
		title: "نضمن لك تجربة تعليمية آمنة وموثوقة",
		subtitle: "كل ما تحتاجه للتركيز على التعلم فقط",
		features: [
			{
				iconName: "ShieldCheck",
				title: "معلمون موثقون ومؤهلون",
				description:
					"نقوم بمراجعة وتوثيق شهادات وهويات جميع المعلمين لضمان بيئة آمنة وعالية الجودة.",
			},
			{
				iconName: "Video",
				title: "فصول افتراضية متطورة",
				description:
					"جلسات مباشرة تفاعلية مدعومة بأدوات مثل السبورة البيضاء ومشاركة الشاشة.",
			},
			{
				iconName: "CreditCard",
				title: "مدفوعات إلكترونية آمنة",
				description: "نظام دفع محمي مع ضمان استرجاع الرسوم في حالة عدم الرضا.",
			},
			{
				iconName: "MessageCircle",
				title: "دعم فني متواصل",
				description:
					"فريقنا متواجد دائماً للإجابة على استفساراتكم وحل أي مشكلة.",
			},
		],
	},
	footerCta: {
		title: "جاهز لتبدأ؟",
		subtitle:
			"انضم إلى مئات الطلاب الذين حققوا أهدافهم الأكاديمية مع معلمي إديونست المميزين.",
		btnText: "انشئ حسابك مجاناً الآن",
		btnLink: "/register",
	},
};
