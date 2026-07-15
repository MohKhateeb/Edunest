"use client";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface BookingSuccessStateProps {
	isTrial?: boolean;
}

export function BookingSuccessState({ isTrial }: BookingSuccessStateProps) {
    const t = useTranslations('bookings');
	return (
		<div className="bg-card border border-border rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
			<div className="text-center py-8 space-y-3">
				<div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
					<CheckCircle className="h-10 w-10" />
				</div>
				<h2 className="text-xl font-bold">
					{isTrial ? t('tm_takyd_hjzk_altjryby') : t('tm_irsal_tlb_alhjz')}
				</h2>
				<p className="text-xs text-muted-foreground">
					{isTrial ? t('ytm_nqlk_alan_ila') : t('sytm_ishaark_fwr_rd')}
				</p>
			</div>
		</div>
	);
}
