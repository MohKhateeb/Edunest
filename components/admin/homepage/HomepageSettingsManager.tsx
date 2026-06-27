"use client";

import { Save, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateHomepageLayout } from "@/lib/actions/admin";
import { defaultHomepageContent } from "@/lib/default-homepage-content";
import type { HomepageContent } from "@/types/homepage";
import AnnouncementEditor from "./AnnouncementEditor";
import AssuranceEditor from "./AssuranceEditor";
import FooterCtaEditor from "./FooterCtaEditor";
import HeroEditor from "./HeroEditor";
import JourneyEditor from "./JourneyEditor";
import PersuasionEditor from "./PersuasionEditor";

interface Props {
	initialLayoutJson: string | null;
}

export default function HomepageSettingsManager({ initialLayoutJson }: Props) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	// Parse initial or use default
	const [content, setContent] = useState<HomepageContent>(() => {
		if (initialLayoutJson) {
			try {
				const parsed = JSON.parse(initialLayoutJson);
				// Merge with defaults to ensure all fields exist
				return { ...defaultHomepageContent, ...parsed };
			} catch (e) {
				console.error("Failed to parse initial layout", e);
				return defaultHomepageContent;
			}
		}
		return defaultHomepageContent;
	});

	const [activeTab, setActiveTab] = useState<keyof HomepageContent | "announcementBanner">("announcementBanner");

	const handleSave = async () => {
		setIsLoading(true);
		try {
			const jsonString = JSON.stringify(content);
			const res = await updateHomepageLayout(jsonString);

			if (res.success) {
				toast.success("تم حفظ إعدادات الصفحة الرئيسية بنجاح");
				router.refresh();
			} else {
				toast.error(res.error || "حدث خطأ أثناء الحفظ");
			}
		} catch (error) {
			toast.error("حدث خطأ غير متوقع");
		} finally {
			setIsLoading(false);
		}
	};

	const tabs = [
		{ id: "announcementBanner", label: "الشريط الإعلاني" },
		{ id: "hero", label: "القسم الافتتاحي (Hero)" },
		{ id: "persuasion", label: "قسم الإقناع" },
		{ id: "journey", label: "رحلة التعلم" },
		{ id: "assurance", label: "الضمانات" },
		{ id: "footerCta", label: "الدعوة الختامية" },
	] as const;

	return (
		<div className="space-y-6">
			{/* Tabs Header */}
			<div className="bg-card border border-border rounded-xl p-2 flex flex-wrap gap-2 shadow-sm">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id as keyof HomepageContent)}
						className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
							activeTab === tab.id
								? "bg-primary text-white shadow-md shadow-primary/20"
								: "hover:bg-muted text-muted-foreground"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Editor Content Area */}
			<div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
				<div className="mb-6 flex justify-between items-center border-b border-border pb-4">
					<h2 className="text-lg font-bold text-foreground">
						{tabs.find((t) => t.id === activeTab)?.label}
					</h2>
					<button
						onClick={handleSave}
						disabled={isLoading}
						className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50"
					>
						{isLoading ? (
							<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
						) : (
							<Save className="w-4 h-4" />
						)}
						حفظ التعديلات
					</button>
				</div>

				<div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
					{activeTab === "announcementBanner" && (
						<AnnouncementEditor
							content={content.announcementBanner}
							onChange={(val) => setContent({ ...content, announcementBanner: val })}
						/>
					)}
					{activeTab === "hero" && (
						<HeroEditor
							content={content.hero}
							onChange={(val) => setContent({ ...content, hero: val })}
						/>
					)}
					{activeTab === "persuasion" && (
						<PersuasionEditor
							content={content.persuasion}
							onChange={(val) => setContent({ ...content, persuasion: val })}
						/>
					)}
					{activeTab === "journey" && (
						<JourneyEditor
							content={content.journey}
							onChange={(val) => setContent({ ...content, journey: val })}
						/>
					)}
					{activeTab === "assurance" && (
						<AssuranceEditor
							content={content.assurance}
							onChange={(val) => setContent({ ...content, assurance: val })}
						/>
					)}
					{activeTab === "footerCta" && (
						<FooterCtaEditor
							content={content.footerCta}
							onChange={(val) => setContent({ ...content, footerCta: val })}
						/>
					)}
				</div>
			</div>

			<div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs">
				<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
				<p className="font-medium leading-relaxed">
					التعديلات التي تقوم بحفظها ستظهر مباشرة على الصفحة الرئيسية للزوار. تأكد من مراجعة النصوص والروابط قبل الحفظ.
				</p>
			</div>
		</div>
	);
}
