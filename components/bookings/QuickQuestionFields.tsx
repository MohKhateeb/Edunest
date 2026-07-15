"use client";
export function QuickQuestionFields({
	title,
	details,
	onChange,
}: {
	title: string;
	details: string;
	onChange: (name: string, value: string) => void;
}) {
    const t = useTranslations('bookings');
	return (
		<div className="bg-accent/40 border border-border rounded-xl p-4 space-y-3 animate-fadeIn">
			<h3 className="text-xs font-bold text-primary">
				{t('byanat_almsalh_alsryah_almtlwb')}</h3>
			<div className="space-y-1">
				<label className="text-[11px] font-semibold text-muted-foreground block">
					{t('anwan_alsoal_almsalh')}</label>
				<input
					type="text"
					required
					value={title}
					onChange={(e) => onChange("questionTitle", e.target.value)}
					placeholder={t('mthal_hl_maadlh_tfadlyh')}
					className="w-full premium-input text-xs"
				/>
			</div>
			<div className="space-y-1">
				<label className="text-[11px] font-semibold text-muted-foreground block">
					{t('tfasyl_almsalh_aw_alwajb')}</label>
				<textarea
					required
					rows={3}
					value={details}
					onChange={(e) => onChange("questionDetails", e.target.value)}
					placeholder={t('aktb_tfasyl_almsalh_alhsabyh')}
					className="w-full premium-input text-xs resize-none"
				/>
			</div>
		</div>
	);
}

import { useTranslations } from "next-intl";
