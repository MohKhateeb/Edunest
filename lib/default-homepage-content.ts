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
