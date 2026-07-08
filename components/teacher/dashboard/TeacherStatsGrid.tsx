import { Calendar, Clock, DollarSign, Star } from "lucide-react";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import { formatPrice } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface TeacherStatsGridProps {
	pendingRequestsCount: number;
	totalEarnings: number;
	totalSessions: number;
	averageRating: number;
	upcomingCount: number;
}

export default function TeacherStatsGrid({
	pendingRequestsCount,
	totalEarnings,
	totalSessions,
	averageRating,
	upcomingCount,
}: TeacherStatsGridProps) {
    const t = useTranslations('dashboard');
	return (
		<div className="pt-2 border-t border-border/50">
			<InteractiveMessage
				character="hakeem"
				title={t('mwjz_alhkym_lidarh_hssk')}
				message={
					pendingRequestsCount > 0
						? t('pending_bookings_count_message', { count: pendingRequestsCount })
						: t('amwrk_mmtazh_ahrs_ala')
				}
			/>

			{/* Grid Stats */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
				<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
					<div className="p-2 bg-primary/10 text-primary rounded-2xl mb-2">
						<DollarSign className="h-5 w-5" />
					</div>
					<span className="text-2xl font-black text-foreground mb-1">{formatPrice(totalEarnings)}</span>
					<span className="text-xs text-muted-foreground font-bold">{t('ijmaly_alarbah')}</span>
				</div>

				<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
					<div className="p-2 bg-teal-50 dark:bg-teal-950/20 text-teal-600 rounded-2xl mb-2">
						<Calendar className="h-5 w-5" />
					</div>
					<span className="text-2xl font-black text-foreground mb-1">{totalSessions}</span>
					<span className="text-xs text-muted-foreground font-bold">{t('hss_mktmlh')}</span>
				</div>

				<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
					<div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 rounded-2xl mb-2">
						<Star className="h-5 w-5 fill-currentColor" />
					</div>
					<span className="text-2xl font-black text-foreground mb-1">{averageRating.toFixed(1)}</span>
					<span className="text-xs text-muted-foreground font-bold">{t('mtwst_altqyym')}</span>
				</div>

				<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
					<div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-2xl mb-2">
						<Clock className="h-5 w-5" />
					</div>
					<span className="text-2xl font-black text-foreground mb-1">{upcomingCount}</span>
					<span className="text-xs text-muted-foreground font-bold">{t('hss_qadmh')}</span>
				</div>
			</div>
		</div>
	);
}
