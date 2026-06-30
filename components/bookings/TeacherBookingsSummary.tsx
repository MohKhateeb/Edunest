import { AlertTriangle, CalendarCheck, Clock, TrendingUp, Lock } from "lucide-react";
import { useMemo } from "react";
import type { DetailedBooking } from "@/lib/types";
import { getDetailedSessionState } from "@/lib/utils/booking-state";
import { getLocalDateString } from "@/lib/utils/time";

interface TeacherBookingsSummaryProps {
	bookings: DetailedBooking[];
}

export function TeacherBookingsSummary({
	bookings,
}: TeacherBookingsSummaryProps) {
	const stats = useMemo(() => {
		const todayStr = getLocalDateString(new Date());
		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();

		let ghostCount = 0;
		let pendingCount = 0;
		let todayCount = 0;
		let completedThisMonth = 0;
		let frozenCount = 0;

		bookings.forEach((b) => {
			// Pending
			if (b.status === "PENDING") pendingCount++;

			// Today
			const bDateStr = getLocalDateString(new Date(b.startTime));
			if (bDateStr === todayStr && b.status === "CONFIRMED") todayCount++;

			// Ghost (Confirmed but expired > 24h)
			if (b.status === "CONFIRMED") {
				const state = getDetailedSessionState(b.startTime, b.duration);
				if (state.status === "warning_2_frozen" || state.status === "closed_escrow") ghostCount++;
			}

			// Completed this month
			if (b.status === "COMPLETED") {
				const d = new Date(b.startTime);
				if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
					completedThisMonth++;
				}
			}
			// Frozen
			if (b.adminEscrow?.status === "PENDING") frozenCount++;
		});

		return { ghostCount, pendingCount, todayCount, completedThisMonth, frozenCount };
	}, [bookings]);

	return (
		<div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
			{/* Ghost Sessions (Urgent) */}
			<div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-2xl p-4 flex items-start gap-4 transition-all hover:shadow-md">
				<div className="p-2.5 bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 rounded-xl">
					<AlertTriangle className="h-5 w-5" />
				</div>
				<div>
					<p className="text-xs font-bold text-muted-foreground mb-1">
						تقارير متأخرة
					</p>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-black text-rose-600 dark:text-rose-400">
							{stats.ghostCount}
						</span>
						<span className="text-[10px] text-rose-500 font-semibold">
							جلسة معلقة
						</span>
					</div>
				</div>
			</div>

			{/* Frozen Funds */}
			<div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-2xl p-4 flex items-start gap-4 transition-all hover:shadow-md">
				<div className="p-2.5 bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 rounded-xl">
					<Lock className="h-5 w-5" />
				</div>
				<div>
					<p className="text-xs font-bold text-muted-foreground mb-1">
						أموال مجمدة
					</p>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-black text-purple-600 dark:text-purple-400">
							{stats.frozenCount}
						</span>
						<span className="text-[10px] text-purple-500 font-semibold">
							بانتظار القرار
						</span>
					</div>
				</div>
			</div>

			{/* Pending Approvals */}
			<div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-2xl p-4 flex items-start gap-4 transition-all hover:shadow-md">
				<div className="p-2.5 bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 rounded-xl">
					<Clock className="h-5 w-5" />
				</div>
				<div>
					<p className="text-xs font-bold text-muted-foreground mb-1">
						بانتظار موافقتك
					</p>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-black text-amber-600 dark:text-amber-400">
							{stats.pendingCount}
						</span>
						<span className="text-[10px] text-amber-500 font-semibold">
							طلب حجز
						</span>
					</div>
				</div>
			</div>

			{/* Today's Sessions */}
			<div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-4 flex items-start gap-4 transition-all hover:shadow-md">
				<div className="p-2.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-xl">
					<CalendarCheck className="h-5 w-5" />
				</div>
				<div>
					<p className="text-xs font-bold text-muted-foreground mb-1">
						حصص اليوم
					</p>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
							{stats.todayCount}
						</span>
						<span className="text-[10px] text-emerald-500 font-semibold">
							مجدولة
						</span>
					</div>
				</div>
			</div>

			{/* Monthly Achievements */}
			<div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-2xl p-4 flex items-start gap-4 transition-all hover:shadow-md">
				<div className="p-2.5 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 rounded-xl">
					<TrendingUp className="h-5 w-5" />
				</div>
				<div>
					<p className="text-xs font-bold text-muted-foreground mb-1">
						إنجاز الشهر
					</p>
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-black text-blue-600 dark:text-blue-400">
							{stats.completedThisMonth}
						</span>
						<span className="text-[10px] text-blue-500 font-semibold">
							مكتملة
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
