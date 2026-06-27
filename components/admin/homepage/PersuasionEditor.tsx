"use client";

import type { PersuasionSectionContent } from "@/types/homepage";

interface Props {
	content: PersuasionSectionContent;
	onChange: (content: PersuasionSectionContent) => void;
}

export default function PersuasionEditor({ content, onChange }: Props) {
	const updateField = (
		field: keyof PersuasionSectionContent,
		value: string,
	) => {
		onChange({ ...content, [field]: value });
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					عنوان القسم الرئيسي
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
				<input
					type="text"
					value={content.subtitle}
					onChange={(e) => updateField("subtitle", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>

			<div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl space-y-3">
				<h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-xs mb-2">
					محتوى بطاقة (حكيم)
				</h4>
				<div className="space-y-1.5">
					<label className="text-[11px] font-bold text-muted-foreground block">
						شارة البطاقة (مثال: نصيحة حكيم)
					</label>
					<input
						type="text"
						value={content.hakeemTag}
						onChange={(e) => updateField("hakeemTag", e.target.value)}
						className="w-full premium-input text-xs"
					/>
				</div>
				<div className="space-y-1.5">
					<label className="text-[11px] font-bold text-muted-foreground block">
						مقولة حكيم
					</label>
					<textarea
						rows={4}
						value={content.hakeemQuote}
						onChange={(e) => updateField("hakeemQuote", e.target.value)}
						className="w-full premium-input text-xs leading-relaxed resize-none"
					/>
				</div>
			</div>

			<div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-3">
				<h4 className="font-bold text-blue-700 dark:text-blue-400 text-xs mb-2">
					محتوى بطاقة (نجيب)
				</h4>
				<div className="space-y-1.5">
					<label className="text-[11px] font-bold text-muted-foreground block">
						شارة البطاقة (مثال: رأي نجيب)
					</label>
					<input
						type="text"
						value={content.najeebTag}
						onChange={(e) => updateField("najeebTag", e.target.value)}
						className="w-full premium-input text-xs"
					/>
				</div>
				<div className="space-y-1.5">
					<label className="text-[11px] font-bold text-muted-foreground block">
						مقولة نجيب
					</label>
					<textarea
						rows={4}
						value={content.najeebQuote}
						onChange={(e) => updateField("najeebQuote", e.target.value)}
						className="w-full premium-input text-xs leading-relaxed resize-none"
					/>
				</div>
			</div>
		</div>
	);
}
