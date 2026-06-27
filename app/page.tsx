import React from "react";
import AssuranceSection from "@/components/home/AssuranceSection";
import FooterCTA from "@/components/home/FooterCTA";
import HeroSection from "@/components/home/HeroSection";
import JourneyPath from "@/components/home/JourneyPath";
import PersuasionSection from "@/components/home/PersuasionSection";
import AnnouncementBanner from "@/components/home/AnnouncementBanner";
import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";
import { prisma } from "@/lib/prisma";
import { defaultHomepageContent } from "@/lib/default-homepage-content";
import type { HomepageContent } from "@/types/homepage";

export const metadata = {
	title: "إديونست | المنصة التعليمية الفلسطينية الأولى",
	description:
		"ابحث عن معلم خصوصي موثوق لطفلك في الضفة الغربية. حجز فوري، دفع آمن، ومتابعة مستمرة.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
	// Fetch dynamic content
	let content: HomepageContent = defaultHomepageContent;
	try {
		const layoutSetting = await prisma.systemSetting.findUnique({
			where: { settingKey: "HomepageLayout" },
		});
		if (layoutSetting?.settingValue) {
			const parsed = JSON.parse(layoutSetting.settingValue);
			content = { ...defaultHomepageContent, ...parsed };
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
