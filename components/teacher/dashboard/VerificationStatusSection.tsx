"use client";
import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";

interface VerificationStatusSectionProps {
	isVerified: boolean;
	verificationLevel: string;
}

export default function VerificationStatusSection({
	isVerified,
	verificationLevel,
}: VerificationStatusSectionProps) {
    const t = useTranslations('dashboard');
	return (
		<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
			<h2 className="font-black text-lg border-b border-border pb-3 flex items-center gap-2">
				<BadgeCheck className="h-6 w-6 text-emerald-500" />
				{t('halh_altwthyq')}</h2>
			<div className="text-sm space-y-3 font-semibold">
				<div className="flex justify-between items-center py-1">
					<span className="text-muted-foreground">{t('mwthq_mn_alidarh')}</span>
					<span
						className={`font-black ${isVerified ? "text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg" : "text-slate-500"}`}
					>
						{isVerified ? t('nam') : t('la')}
					</span>
				</div>
				<div className="flex justify-between items-center py-1">
					<span className="text-muted-foreground">{t('mstwa_altwthyq')}</span>
					<span className="font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">
						{verificationLevel}
					</span>
				</div>
				{!isVerified && (
					<div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-2xl p-4 text-xs leading-relaxed border border-yellow-200 dark:border-yellow-800 mt-2">
						{t('yrja_alantqal_lsfhh')}<strong>{t('wthaeq_altwthyq')}</strong> {t('wrfa_hwytk_walshhadh_aljamayh')}</div>
				)}
			</div>
		</div>
	);
}
