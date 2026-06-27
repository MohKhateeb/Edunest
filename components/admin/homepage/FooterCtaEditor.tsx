"use client";

import type { FooterCtaContent } from "@/types/homepage";

interface Props {
	content: FooterCtaContent;
	onChange: (content: FooterCtaContent) => void;
}

export default function FooterCtaEditor({ content, onChange }: Props) {
	const updateField = (field: keyof FooterCtaContent, value: string) => {
		onChange({ ...content, [field]: value });
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					العنوان الرئيسي
				</label>
				<input
					type="text"
					value={content.title}
					onChange={(e) => updateField("title", e.target.value)}
					className="w-full premium-input text-xs font-bold"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					الوصف / العنوان الفرعي
				</label>
				<textarea
					rows={2}
					value={content.subtitle}
					onChange={(e) => updateField("subtitle", e.target.value)}
					className="w-full premium-input text-xs leading-relaxed resize-none"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					نص زر الدعوة
				</label>
				<input
					type="text"
					value={content.btnText}
					onChange={(e) => updateField("btnText", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					رابط زر الدعوة
				</label>
				<input
					type="text"
					value={content.btnLink}
					onChange={(e) => updateField("btnLink", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
		</div>
	);
}
