"use client";

import type { HeroSectionContent } from "@/types/homepage";
import { useTranslations } from "next-intl";

interface Props {
	content: HeroSectionContent;
	onChange: (content: HeroSectionContent) => void;
}

export default function HeroEditor({ content, onChange }: Props) {
    const t = useTranslations('common');
	const updateField = (field: keyof HeroSectionContent, value: string) => {
		onChange({ ...content, [field]: value });
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('sharh_albanr_altrwyjyh_mthal')}</label>
				<input
					type="text"
					value={content.badge}
					onChange={(e) => updateField("badge", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('ns_alsharh_altrwyjyh')}</label>
				<input
					type="text"
					value={content.badgeMessage}
					onChange={(e) => updateField("badgeMessage", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('alanwan_alaryd_alreysy')}</label>
				<input
					type="text"
					value={content.headline}
					onChange={(e) => updateField("headline", e.target.value)}
					className="w-full premium-input text-xs font-bold"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('alklmh_almmyzh_ballwn_jza')}</label>
				<input
					type="text"
					value={content.highlightedWord}
					onChange={(e) => updateField("highlightedWord", e.target.value)}
					className="w-full premium-input text-xs font-bold text-primary"
				/>
			</div>
			<div className="space-y-1.5 md:col-span-2">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('alwsf_alfqrh_tht_alanwan')}</label>
				<textarea
					rows={3}
					value={content.subheadline}
					onChange={(e) => updateField("subheadline", e.target.value)}
					className="w-full premium-input text-xs leading-relaxed resize-none"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('ns_zr_aldawh_alreysy')}</label>
				<input
					type="text"
					value={content.primaryBtnText}
					onChange={(e) => updateField("primaryBtnText", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('rabt_zr_aldawh_alreysy')}</label>
				<input
					type="text"
					value={content.primaryBtnLink}
					onChange={(e) => updateField("primaryBtnLink", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('ns_alzr_althanwy')}</label>
				<input
					type="text"
					value={content.secondaryBtnText}
					onChange={(e) => updateField("secondaryBtnText", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('rabt_alzr_althanwy')}</label>
				<input
					type="text"
					value={content.secondaryBtnLink}
					onChange={(e) => updateField("secondaryBtnLink", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('rsalh_alshkhsyh_alawla_hkym')}</label>
				<input
					type="text"
					value={content.character1Message}
					onChange={(e) => updateField("character1Message", e.target.value)}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1.5">
				<label className="text-[11px] font-bold text-muted-foreground block">
					{t('rsalh_alshkhsyh_althanyh_njyb')}</label>
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
