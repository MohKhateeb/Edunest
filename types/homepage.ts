export interface AnnouncementBannerContent {
	isActive: boolean;
	text: string;
	link: string;
	backgroundColor?: string;
	textColor?: string;
}

export interface HeroSectionContent {
	badge: string;
	badgeMessage: string;
	headline: string;
	highlightedWord: string;
	subheadline: string;
	primaryBtnText: string;
	primaryBtnLink: string;
	secondaryBtnText: string;
	secondaryBtnLink: string;
	character1Message: string;
	character2Message: string;
}

export interface PersuasionSectionContent {
	title: string;
	subtitle: string;
	hakeemTag: string;
	hakeemQuote: string;
	najeebTag: string;
	najeebQuote: string;
}

export interface JourneyPathContent {
	title: string;
	subtitle: string;
	steps: {
		title: string;
		description: string;
	}[];
}

export interface AssuranceSectionContent {
	title: string;
	subtitle: string;
	features: {
		title: string;
		description: string;
		iconName: string; // e.g., 'ShieldCheck'
	}[];
}

export interface FooterCtaContent {
	title: string;
	subtitle: string;
	btnText: string;
	btnLink: string;
}

export interface HomepageContent {
	announcementBanner: AnnouncementBannerContent;
	hero: HeroSectionContent;
	persuasion: PersuasionSectionContent;
	journey: JourneyPathContent;
	assurance: AssuranceSectionContent;
	footerCta: FooterCtaContent;
}
