"use client";

import type { HeroSectionContent } from "@/types/homepage";

interface Props {
	content: HeroSectionContent;
	onChange: (content: HeroSectionContent) => void;
}

export default function HeroEditor({ content, onChange }: Props) {
	const updateField = (field: keyof HeroSectionContent, value: string) => {
		onChange({ ...content, [field]: value });
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					شارة البانر الترويجية (مثال: جديد)
				</label>
				<input
					type="text"
					value={content.badge}
					onChange={(e) => updateField("badge", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					نص الشارة الترويجية
				</label>
				<input
					type="text"
					value={content.badgeMessage}
					onChange={(e) => updateField("badgeMessage", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					العنوان العريض الرئيسي
				</label>
				<input
					type="text"
					value={content.headline}
					onChange={(e) => updateField("headline", e.target.value)}
					className="w-full premium-input text-xs font-bold"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					الكلمة المميزة باللون (جزء من العنوان)
				</label>
				<input
					type="text"
					value={content.highlightedWord}
					onChange={(e) => updateField("highlightedWord", e.target.value)}
					className="w-full premium-input text-xs font-bold text-primary"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					الوصف (الفقرة تحت العنوان)
				</label>
				<textarea
					rows={3}
					value={content.subheadline}
					onChange={(e) => updateField("subheadline", e.target.value)}
					className="w-full premium-input text-xs leading-relaxed resize-none"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					نص زر الدعوة الرئيسي
				</label>
				<input
					type="text"
					value={content.primaryBtnText}
					onChange={(e) => updateField("primaryBtnText", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					رابط زر الدعوة الرئيسي
				</label>
				<input
					type="text"
					value={content.primaryBtnLink}
					onChange={(e) => updateField("primaryBtnLink", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					نص الزر الثانوي
				</label>
				<input
					type="text"
					value={content.secondaryBtnText}
					onChange={(e) => updateField("secondaryBtnText", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					رابط الزر الثانوي
				</label>
				<input
					type="text"
					value={content.secondaryBtnLink}
					onChange={(e) => updateField("secondaryBtnLink", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					رسالة الشخصية الأولى (حكيم)
				</label>
				<input
					type="text"
					value={content.character1Message}
					onChange={(e) => updateField("character1Message", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					رسالة الشخصية الثانية (نجيب)
				</label>
				<input
					type="text"
					value={content.character2Message}
					onChange={(e) => updateField("character2Message", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
		</div>
	);
}
