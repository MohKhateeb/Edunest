import {
	Calendar as CalendarIcon,
	Check,
	ChevronLeft,
	FileText,
	MessageCircleQuestion,
	X,
} from "lucide-react";
import JoinMeetingButton from "@/components/shared/JoinMeetingButton";
import { PaymentCountdown } from "@/components/shared/PaymentCountdown";
import { BOOKING_STATUS_AR } from "@/lib/translations";
import type { DetailedBooking } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
	canSubmitReport,
	getDetailedSessionState,
} from "@/lib/utils/booking-state";
import { formatTimeOnly } from "@/lib/utils/time";

interface DailyScheduleProps {
	dateStr: string;
	bookings: DetailedBooking[];
	onBookingClick: (id: string) => void;
	onReportClick: (id: string) => void;
	loadingId: string | null;
	handleAcceptShortcut: (id: string, e: React.MouseEvent) => void;
	handleRejectShortcut: (id: string, e: React.MouseEvent) => void;
	handleCancelShortcut: (id: string, e: React.MouseEvent) => void;
}

export function DailySchedule({
	dateStr,
	bookings,
	onBookingClick,
	onReportClick,
	loadingId,
	handleAcceptShortcut,
	handleRejectShortcut,
	handleCancelShortcut,
}: DailyScheduleProps) {
	const now = Date.now();

	const getBookingTimeState = (booking: DetailedBooking) => {
		const start = new Date(booking.startTime).getTime();
		const end = start + booking.duration * 60_000;
		const earlyJoinTime = start - 5 * 60_000;

		if (now < earlyJoinTime) return "waiting";
		if (now >= earlyJoinTime && now <= end) return "active";
		return "expired";
	};

	const displayDate = new Intl.DateTimeFormat("ar-PS", {
		dateStyle: "full",
		timeZone: "Asia/Hebron",
	}).format(new Date(dateStr + "T12:00:00"));

	if (bookings.length === 0) {
		return (
			<div className="h-full flex flex-col items-center justify-center p-8 bg-card border border-border/80 rounded-3xl text-center space-y-4">
				<div className="h-16 w-16 bg-accent/50 text-muted-foreground rounded-full flex items-center justify-center">
					<CalendarIcon className="h-8 w-8 opacity-50" />
				</div>
				<div>
					<h3 className="font-extrabold text-lg text-foreground">
						لا توجد جلسات مجدولة
					</h3>
					<p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">
						يوم {displayDate} فارغ ولا يحتوي على أي حجوزات أو حصص دراسية.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm min-h-full">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4 mb-6">
				<div>
					<h2 className="font-black text-lg">جلسات اليوم</h2>
					<p className="text-xs text-primary font-bold">{displayDate}</p>
				</div>
				<div className="text-xs font-bold bg-accent/40 px-3 py-1.5 rounded-lg border border-border">
					{bookings.length} جلسات
				</div>
			</div>

			<div className="space-y-4">
				{bookings.map((b) => {
					const state = getDetailedSessionState(b.startTime, b.duration);
					const timeState = state.status;
					const showReportButton =
						b.status === "CONFIRMED" &&
						canSubmitReport(b.startTime, b.duration) &&
						!b.report;

					return (
						<div
							key={b.id}
							className={cn(
								"group flex flex-col md:flex-row md:items-center justify-between gap-4 border p-4 rounded-2xl hover:bg-accent/40 transition-all cursor-pointer shadow-xs hover:shadow-sm",
								b.status === "PENDING" || b.status === "PENDING_APPROVAL"
									? "border-amber-200/60 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10"
									: b.status === "AWAITING_PAYMENT"
										? "border-sky-200/60 dark:border-sky-900/40 bg-sky-50/20 dark:bg-sky-950/10"
										: b.status === "CONFIRMED"
											? "border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10"
											: b.status === "COMPLETED"
												? "border-blue-200/60 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/10"
												: "border-border opacity-75 grayscale bg-muted/20",
							)}
							onClick={() => onBookingClick(b.id)}
						>
							<div className="flex items-start gap-4 flex-1 min-w-0">
								<div className="text-center shrink-0 w-16 border-e border-border/60 pe-4">
									<div className="text-lg font-black text-foreground leading-none">
										{formatTimeOnly(b.startTime)}
									</div>
									<div className="text-[10px] font-bold text-muted-foreground mt-1">
										{b.duration} دقيقة
									</div>
								</div>

								<div className="space-y-1.5 flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<span
											className={cn(
												"text-[10px] font-extrabold px-2 py-0.5 rounded-full border",
												(b.status === "PENDING" || b.status === "PENDING_APPROVAL") &&
													"bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400",
												b.status === "AWAITING_PAYMENT" &&
													"bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-400",
												b.status === "CONFIRMED" &&
													"bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400",
												b.status === "COMPLETED" &&
													"bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400",
												(b.status === "CANCELLED" || b.status === "REJECTED" || b.status === "EXPIRED") &&
													"bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400",
											)}
										>
											{BOOKING_STATUS_AR[b.status as keyof typeof BOOKING_STATUS_AR] || b.status}
										</span>
										{b.isTrial && (
											<span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-400">
												ترايل مجاني
											</span>
										)}
										{b.adminEscrow?.status === "PENDING" && (
											<span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400" title="الأرباح محتجزة بانتظار قرار إداري">
												أموال مجمدة
											</span>
										)}
										{b.dispute?.status === "OPEN" && (
											<span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400">
												نزاع مفتوح
											</span>
										)}
									</div>

									<div className="text-sm font-bold truncate text-foreground flex items-center gap-2">
										{b.student.name}
										<span className="text-muted-foreground/40 font-normal">
											|
										</span>
										<span className="text-muted-foreground">
											{b.teacherService.serviceType.name}
										</span>
									</div>

									{b.questionTitle && (
										<div className="flex items-start gap-1.5 mt-1 text-xs text-muted-foreground/90 bg-background/50 p-2 rounded-lg border border-border/40 inline-flex max-w-full">
											<FileText className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
											<span className="truncate" title={b.questionTitle}>
												<span className="font-semibold text-foreground/80 me-1">
													موضوع الجلسة:
												</span>
												{b.questionTitle}
											</span>
										</div>
									)}
								</div>
							</div>

							{/* Actions Section */}
							<div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0 justify-center">
								<span
									className={cn(
										"px-3 py-1 rounded-full text-[11px] font-bold border",
										b.status === "CONFIRMED"
											? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800"
											: (b.status === "PENDING" || b.status === "PENDING_APPROVAL")
												? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800"
												: b.status === "AWAITING_PAYMENT"
													? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-800"
													: b.status === "COMPLETED"
														? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800"
														: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
									)}
								>
									{BOOKING_STATUS_AR[b.status as keyof typeof BOOKING_STATUS_AR] || b.status}
								</span>

								<div
									className="flex gap-2 items-center mt-2"
									onClick={(e) => e.stopPropagation()}
								>
									{b.status === "EXPIRED" && (
										<div className="text-[11px] text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-lg text-center max-w-[120px]">
											انتهت مهلة الدفع وتم تحرير الموعد
										</div>
									)}

									{b.status === "AWAITING_PAYMENT" && !b.isTrial && (
										<div className="flex flex-col items-end gap-2">
											{b.paymentDeadline && <PaymentCountdown deadline={new Date(b.paymentDeadline)} />}
											<button
												onClick={(e) => handleCancelShortcut(b.id, e)}
												disabled={loadingId === b.id}
												className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center gap-1"
											>
												{loadingId === b.id ? (
													<span className="h-3.5 w-3.5 border-2 border-t-transparent border-rose-700 rounded-full animate-spin" />
												) : (
													<X className="h-3 w-3" />
												)}
												إلغاء الموعد
											</button>
										</div>
									)}

									{/* Pending Shortcuts */}
									{(b.status === "PENDING" || b.status === "PENDING_APPROVAL") && (
										<div className="flex gap-1.5 items-center">
											<button
												onClick={(e) => handleRejectShortcut(b.id, e)}
												disabled={loadingId === b.id}
												className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center gap-1"
											>
												{loadingId === b.id ? (
													<span className="h-3.5 w-3.5 border-2 border-t-transparent border-rose-700 rounded-full animate-spin" />
												) : (
													<X className="h-3 w-3" />
												)}
												رفض
											</button>
											<button
												onClick={(e) => handleAcceptShortcut(b.id, e)}
												disabled={loadingId === b.id}
												className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center gap-1"
											>
												{loadingId === b.id ? (
													<span className="h-3.5 w-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
												) : (
													<Check className="h-3 w-3" />
												)}
												قبول
											</button>
										</div>
									)}

									{/* Confirmed Shortcuts */}
									{b.status === "CONFIRMED" && (
										<>
											{(timeState === "active" ||
												timeState === "ready_to_join" ||
												timeState === "grace_period") && (
												<JoinMeetingButton
													bookingId={b.id}
													variant="small"
													label="انضم للقاعة"
												/>
											)}
											{showReportButton && (
												<button
													onClick={(e) => {
														e.stopPropagation();
														onReportClick(b.id);
													}}
													className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center gap-1.5"
												>
													<FileText className="h-3.5 w-3.5" />
													رفع التقرير
												</button>
											)}
										</>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
