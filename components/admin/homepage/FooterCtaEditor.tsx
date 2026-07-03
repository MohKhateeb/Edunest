"use client";

import type { FooterCtaContent } from "@/types/homepage";
import { useTranslations } from "next-intl";

interface Props {
	content: FooterCtaContent;
	onChange: (content: FooterCtaContent) => void;
}

export default function FooterCtaEditor({ content, onChange }: Props) {
    const t = useTranslations('common');
	const updateField = (field: keyof FooterCtaContent, value: string) => {
		onChange({ ...content, [field]: value });
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('alanwan_alreysy')}</label>
				<input
					type="text"
					value={content.title}
					onChange={(e) => updateField("title", e.target.value)}
					className="w-full premium-input text-xs font-bold"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('alwsf_alanwan_alfray')}</label>
				<textarea
					rows={2}
					value={content.subtitle}
					onChange={(e) => updateField("subtitle", e.target.value)}
					className="w-full premium-input text-xs leading-relaxed resize-none"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('ns_zr_aldawh')}</label>
				<input
					type="text"
					value={content.btnText}
					onChange={(e) => updateField("btnText", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('rabt_zr_aldawh')}</label>
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
