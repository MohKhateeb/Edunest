"use client";

import type { AnnouncementBannerContent } from "@/types/homepage";

interface Props {
	content: AnnouncementBannerContent;
	onChange: (content: AnnouncementBannerContent) => void;
}

export default function AnnouncementEditor({ content, onChange }: Props) {
	const updateField = <K extends keyof AnnouncementBannerContent>(
		field: K,
		value: AnnouncementBannerContent[K],
	) => {
		onChange({ ...content, [field]: value });
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-xl">
				<div>
					<h3 className="font-bold text-sm">تفعيل الشريط الإعلاني</h3>
					<p className="text-xs text-muted-foreground">
						سيظهر شريط إعلاني أعلى الصفحة الرئيسية عند تفعيله
					</p>
				</div>
				<label className="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						className="sr-only peer"
						checked={content.isActive}
						onChange={(e) => updateField("isActive", e.target.checked)}
					/>
					<div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:right-[2px] rtl:after:left-auto after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
				</label>
			</div>

			{content.isActive && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-1.5 md:col-span-2">
						<label className="text-[11px] font-bold text-muted-foreground block">
							نص الإعلان
						</label>
						<input
							type="text"
							value={content.text}
							onChange={(e) => updateField("text", e.target.value)}
							className="w-full premium-input text-xs"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-[11px] font-bold text-muted-foreground block">
							رابط الإعلان (اختياري)
						</label>
						<input
							type="text"
							value={content.link}
							onChange={(e) => updateField("link", e.target.value)}
							className="w-full premium-input text-xs"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-[11px] font-bold text-muted-foreground block">
							لون الخلفية (كلاس Tailwind)
						</label>
						<input
							type="text"
							value={content.backgroundColor || ""}
							onChange={(e) => updateField("backgroundColor", e.target.value)}
							className="w-full premium-input text-xs"
							placeholder="bg-primary أو bg-amber-500"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
