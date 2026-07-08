import { getTranslations } from "next-intl/server";
import React from "react";
import AnnouncementBanner from "@/components/home/AnnouncementBanner";
import AssuranceSection from "@/components/home/AssuranceSection";
import FooterCTA from "@/components/home/FooterCTA";
import HeroSection from "@/components/home/HeroSection";
import JourneyPath from "@/components/home/JourneyPath";
import PersuasionSection from "@/components/home/PersuasionSection";

import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";
import { getDefaultHomepageContent } from "@/lib/default-homepage-content";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";
import type { HomepageContent } from "@/types/homepage";

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
	const {locale} = await params;
	const t = await getTranslations({locale: locale || 'ar', namespace: 'common'});
	return {
		title: t('key_1783109425880_bpgi') ,
		description: t('key_1783109425883_ndoy'),
	};
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
	const tHome = await getTranslations("home");
	const defaultContent = getDefaultHomepageContent(tHome);
	// Fetch dynamic content
	let content: HomepageContent = defaultContent;
	try {
		const layoutSetting = await SystemAdminService.getHomepageData();
		if (layoutSetting?.settingValue) {
			const parsed = JSON.parse(layoutSetting.settingValue);
			content = { ...defaultContent, ...parsed };
		}
	} catch (e) {
		console.error("Error fetching homepage layout:", e);
	}

	return (
		<div className="min-h-screen flex flex-col overflow-x-hidden bg-background">
			{content.announcementBanner.isActive && (
				<AnnouncementBanner content={content.announcementBanner} />
			)}
			<Header />

			<main className="flex-1">
				<HeroSection content={content.hero} />
				<PersuasionSection content={content.persuasion} />
				<JourneyPath content={content.journey} />
				<AssuranceSection content={content.assurance} />
				<FooterCTA content={content.footerCta} />
			</main>

			<Footer />
		</div>
	);
}
