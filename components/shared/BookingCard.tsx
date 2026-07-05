"use client";

import type {
	Booking,
	Payment,
	ServiceType,
	SessionReport,
	Student,
	Teacher,
	TeacherService,
	User,
} from "@prisma/client";
import {
	AlertTriangle,
	BookOpen,
	Calendar,
	Clock,
	CreditCard,
	Eye,
	FileText,
	GraduationCap,
	Lock,
	Star,
	TimerOff,
	User as UserIcon,
	Video,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import DetailsModal from "@/components/shared/DetailsModal";
import JoinMeetingButton from "@/components/shared/JoinMeetingButton";
import Portal from "@/components/shared/Portal";
import ReportModal from "@/components/shared/ReportModal";
import {
	acceptBooking,
	cancelBooking,
	rejectBooking,
	submitSessionReport,
} from "@/lib/actions/booking";
import { submitReview } from "@/lib/actions/review";
import {
	BOOKING_STATUS_AR,
	BOOKING_STATUS_STYLES,
	PAYMENT_METHOD_AR,
	PAYMENT_STATUS_AR,
	PAYMENT_STATUS_STYLES,
} from "@/lib/translations";
import { cn, formatLocalTime } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import {
	canSubmitReport,
	getDetailedSessionState,
	type SessionTimeState,
} from "@/lib/utils/booking-state";
import { useTranslations } from "next-intl";

type BookingCardProps = {
	booking: Booking & {
		student: Student;
		teacherService: TeacherService & {
			serviceType: ServiceType;
			teacher: Teacher & {
				user: Pick<User, "name">;
			};
		};
		parent: Pick<User, "name">;
		payment?: Payment | null;
		report?: SessionReport | null;
	};
	role: "PARENT" | "TEACHER" | "ADMIN";
};

export default function BookingCard({ booking, role }: BookingCardProps) {
    const t = useTranslations('common');
	const [loading, setLoading] = useState(false);

	const [showCancelModal, setShowCancelModal] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [showViewReportModal, setShowViewReportModal] = useState(false);
	const report = booking.report;

	const [showReportModal, setShowReportModal] = useState(false);

	const [showReviewModal, setShowReviewModal] = useState(false);
	const [reviewForm, setReviewForm] = useState({
		rating: 5,
		comment: "",
	});

	const [showDetailsModal, setShowDetailsModal] = useState(false);

	const isTrial = booking.isTrial;
	const priceDisplay = isTrial
		? t('tjrybyh_mjanyh')
		: formatCurrency(Number(booking.price), booking.currency);

	// Actions
	const handleAccept = async () => {
		setLoading(true);
		const res = await acceptBooking(booking.id);
		setLoading(false);
		if (!res.success) toast.error(t('fshl_qbwl_alhjz'), { description: res.error });
		else toast.success(t('tm_qbwl_alhjz_bnjah'));
	};

	const handleReject = async () => {
		setLoading(true);
		const res = await rejectBooking(booking.id);
		setLoading(false);
		if (!res.success) toast.error(t('fshl_rfd_alhjz'), { description: res.error });
		else toast.success(t('tm_rfd_alhjz'));
	};

	const handleCancelSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (cancelReason.trim().length < 5) {
			toast.warning(t('sbb_alilghaa_qsyr_jda'), {
				description: t('alrjaa_ktabh_sbb_ilghaa'),
			});
			return;
		}
		setLoading(true);
		const res = await cancelBooking({
			bookingId: booking.id,
			reason: cancelReason,
		});
		setLoading(false);
		if (res.success) {
			toast.success(t('tm_alilghaa_bnjah'), {
				description: t('tm_ilghaa_aljlsh_wiblagh'),
			});
			setShowCancelModal(false);
			setCancelReason("");
		} else {
			toast.error(t('fshl_ilghaa_alhjz'), { description: res.error });
		}
	};

	const handleReviewSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		const res = await submitReview({
			bookingId: booking.id,
			rating: Number(reviewForm.rating),
			comment: reviewForm.comment,
		});
		setLoading(false);
		if (res.success) {
			toast.success(t('shkra_ltqyymk'), {
				description: t('tm_irsal_tqyymk_llmalm'),
			});
			setShowReviewModal(false);
		} else {
			toast.error(t('fshl_irsal_altqyym'), { description: res.error });
		}
	};

	// Meet link (Jitsi Meet)
	const meetLink =
		booking.meetingUrl || `https://meet.jit.si/edunest-${booking.id}`;

	// ════════════════════════════════════════════════════
	// حالة تفعيل زر الانضمام بناءً على الوقت (مستورد من booking-state)
	// ════════════════════════════════════════════════════
	const [sessionTimeState, setSessionTimeState] = useState<SessionTimeState>(
		() => getDetailedSessionState(booking.startTime, booking.duration),
	);

	useEffect(() => {
		if (booking.status !== "CONFIRMED") return;

		// تحديث الحالة كل 30 ثانية
		const interval = setInterval(() => {
			setSessionTimeState(
				getDetailedSessionState(booking.startTime, booking.duration),
			);
		}, 30_000);

		// تحديث فوري
		setSessionTimeState(
			getDetailedSessionState(booking.startTime, booking.duration),
		);

		return () => clearInterval(interval);
	}, [booking.status, booking.startTime, booking.duration]);

	return (
		<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
			{/* 🔹 Top Row: Status & Price */}
			<div className="flex justify-between items-start mb-4">
				<div>
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"text-[11px] font-bold px-3 py-1.5 rounded-full border",
								BOOKING_STATUS_STYLES[booking.status],
							)}
						>
							{BOOKING_STATUS_AR[booking.status]}
						</span>
						{booking.status === "CONFIRMED" &&
							(sessionTimeState.status === "warning_2_frozen" ||
								sessionTimeState.status === "closed_escrow") && (
								<span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-900/40 dark:text-rose-400">
									<AlertTriangle className="h-3 w-3" />
									{t('mtakhrh_alighlaq')}</span>
							)}
					</div>
					{isTrial && (
						<span className="me-2 text-[10px] font-bold px-2 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900 mt-2 inline-block">
							{t('jlsh_tjrybyh')}</span>
					)}
				</div>

				{/* السعر وحالة الدفع (مدمجة وبدون عناوين مزعجة) */}
				<div className="text-end flex flex-col items-end">
					<span className="text-xl font-black text-primary leading-none">
						{priceDisplay}
					</span>
					{!isTrial && (
						<span
							className={cn(
								"text-[10px] mt-1.5 font-bold",
								PAYMENT_STATUS_STYLES[booking.paymentStatus],
							)}
						>
							{PAYMENT_STATUS_AR[booking.paymentStatus]}
						</span>
					)}
				</div>
			</div>

			{/* 🔹 Middle: Core Info (Subject, Date, People) */}
			<div className="space-y-4 mb-5">
				{/* Subject & Duration */}
				<div>
					<h3 className="font-extrabold text-foreground text-base mb-1 line-clamp-1">
						{booking.teacherService.serviceType.name}
					</h3>
					<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
						<Clock className="h-3.5 w-3.5" />
						<span>{booking.duration} {t('dqyqh')}</span>
					</div>
					{booking.questionTitle && (
						<div className="mt-2 text-xs font-semibold text-muted-foreground bg-accent/40 p-2.5 rounded-xl border border-border flex items-start gap-2">
							<span className="shrink-0 text-primary">{t('mwdwa_aljlsh')}</span>
							<span className="text-foreground">{booking.questionTitle}</span>
						</div>
					)}
				</div>

				{/* Date / Time */}
				<div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-border/50">
					<div className="bg-white dark:bg-slate-700 p-2 rounded-xl shadow-sm border border-border/40">
						<Calendar className="h-5 w-5 text-primary" />
					</div>
					<span className="font-black text-foreground text-sm">
						{formatLocalTime(booking.startTime)}
					</span>
				</div>

				{/* People (Teacher / Student) */}
				<div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
					<div className="flex items-center gap-1.5">
						<UserIcon className="h-3.5 w-3.5 text-secondary" />
						<span>
							{role === "TEACHER"
								? booking.parent.name
								: booking.teacherService.teacher.user.name}
						</span>
					</div>
					<span className="w-1 h-1 bg-border rounded-full"></span>
					<div className="flex items-center gap-1.5">
						<GraduationCap className="h-3.5 w-3.5 text-primary" />
						<span className="line-clamp-1">{booking.student.name}</span>
					</div>
				</div>
			</div>

			{/* 🔹 Bottom Row: Actions */}
			<div className="flex flex-wrap gap-2 mt-auto border-t border-border/40 pt-4">
				{/* The Meet link is visible but might be disabled based on time */}
				{booking.status === "CONFIRMED" &&
					(sessionTimeState.status === "active" ||
					sessionTimeState.status === "ready_to_join" ||
					sessionTimeState.status === "grace_period" ? (
						<JoinMeetingButton
							bookingId={booking.id}
							variant="large"
							label={t('andm_alan')}
						/>
					) : (
						<div className="flex-1 flex flex-col items-center">
							<button
								disabled
								className="w-full flex items-center justify-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 py-2.5 rounded-xl cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500"
							>
								<Lock className="h-4 w-4" />
								{t('rabt_aljlsh')}</button>
							<span className="text-[10px] font-bold text-muted-foreground mt-1 text-center w-full">
								{t('syfth_alrabt_qbl_aljlsh')}</span>
						</div>
					))}

				{/* View Details is secondary but always available */}
				<button
					onClick={() => setShowDetailsModal(true)}
					className={cn(
						"text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5",
						booking.status === "CONFIRMED" &&
							sessionTimeState.status === "active"
							? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
							: "flex-1 bg-primary/5 text-primary hover:bg-primary hover:text-white border border-primary/20 hover:border-primary",
					)}
				>
					<Eye className="h-3.5 w-3.5" />
					{t('altfasyl')}</button>

				{/* Action icons based on role and status */}

				{role === "TEACHER" &&
					booking.status === "CONFIRMED" &&
					canSubmitReport(booking.startTime, booking.duration) && (
						<button
							onClick={() => setShowReportModal(true)}
							className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 py-2.5 rounded-xl transition-colors"
						>
							<FileText className="h-3.5 w-3.5" />
							{t('inhaa_wrfa_altqryr')}</button>
					)}

				{role === "PARENT" &&
					booking.status === "COMPLETED" &&
					!booking.report && (
						<button
							onClick={() => setShowReviewModal(true)}
							className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 py-2.5 rounded-xl transition-colors"
						>
							<Star className="h-3.5 w-3.5" />
							{t('tqyym_almalm')}</button>
					)}
			</div>

			{/* Cancellation Modal */}
			{showCancelModal && (
				<Portal>
					<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto">
						<form
							onSubmit={handleCancelSubmit}
							className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl my-8"
						>
							<h3 className="font-extrabold text-lg">{t('ilghaa_hjz_aljlsh')}</h3>
							<p className="text-xs text-muted-foreground">
								{t('yrja_twdyh_sbb_alilghaa')}</p>
							<textarea
								required
								rows={3}
								value={cancelReason}
								onChange={(e) => setCancelReason(e.target.value)}
								placeholder={t('aktb_sbb_ilghaa_alhjz')}
								className="w-full text-sm premium-input resize-none"
							/>
							<div className="flex justify-end gap-3">
								<button
									type="button"
									onClick={() => setShowCancelModal(false)}
									className="text-xs font-semibold border border-border hover:bg-accent px-4 py-2 rounded-lg cursor-pointer"
								>
									{t('traja')}</button>
								<button
									type="submit"
									disabled={loading}
									className="text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg shadow-sm cursor-pointer"
								>
									{t('takyd_alilghaa')}</button>
							</div>
						</form>
					</div>
				</Portal>
			)}

			{/* Session Report Modal */}
			{showReportModal && (
				<ReportModal
					bookingId={booking.id}
					onClose={() => setShowReportModal(false)}
				/>
			)}

			{/* Review Modal */}
			{showReviewModal && (
				<Portal>
					<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto">
						<form
							onSubmit={handleReviewSubmit}
							className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl my-8"
						>
							<h3 className="font-extrabold text-lg">
								{t('tqyym_tjrbh_altalm_ma')}</h3>
							<div className="space-y-3">
								<div className="space-y-1">
									<label className="block text-xs font-semibold text-muted-foreground">
										{t('altqyym_balnjwm')}</label>
									<div className="flex items-center gap-1.5 mt-1">
										{[1, 2, 3, 4, 5].map((star) => (
											<button
												key={star}
												type="button"
												onClick={() =>
													setReviewForm({ ...reviewForm, rating: star })
												}
												className="text-violet-500 hover:scale-110 transition-transform cursor-pointer"
											>
												<Star
													size={32}
													fill={
														star <= reviewForm.rating ? "currentColor" : "none"
													}
													className="text-violet-500"
												/>
											</button>
										))}
									</div>
								</div>
								<div className="space-y-1">
									<label className="block text-xs font-semibold text-muted-foreground">
										{t('talyq_idafy_akhtyary')}</label>
									<textarea
										rows={3}
										value={reviewForm.comment}
										onChange={(e) =>
											setReviewForm({ ...reviewForm, comment: e.target.value })
										}
										placeholder={t('aktb_rayk_wtjrbtk_ma')}
										className="w-full text-sm premium-input resize-none"
									/>
								</div>
							</div>
							<div className="flex justify-end gap-3">
								<button
									type="button"
									onClick={() => setShowReviewModal(false)}
									className="text-xs font-semibold border border-border hover:bg-accent px-4 py-2 rounded-lg cursor-pointer"
								>
									{t('traja')}</button>
								<button
									type="submit"
									disabled={loading}
									className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg shadow-sm cursor-pointer"
								>
									{t('irsal_altqyym')}</button>
							</div>
						</form>
					</div>
				</Portal>
			)}

			{/* View Session Report Modal */}
			{showViewReportModal && report && (
				<Portal>
					<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 p-4 overflow-y-auto animate-in fade-in duration-200">
						<div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl relative animate-in zoom-in-95 duration-200 my-8">
							{/* Header */}
							<div className="flex justify-between items-start border-b border-border pb-3">
								<div>
									<h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
										<FileText className="h-5.5 w-5.5 text-primary" />
										{t('tqryr_aljlsh_altalymyh_almnthyh')}</h3>
									<p className="text-xs text-muted-foreground mt-1">
										{t('almalm')}{" "}
										<span className="font-semibold text-foreground">
											{booking.teacherService.teacher.user.name}
										</span>{" "}
										{t('altalb')}{" "}
										<span className="font-semibold text-foreground">
											{booking.student.name}
										</span>
									</p>
								</div>
								<button
									onClick={() => setShowViewReportModal(false)}
									className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors"
									aria-label={t('ighlaq')}
								>
									✕
								</button>
							</div>

							{/* Content */}
							<div className="space-y-4 text-sm pe-1">
								{/* Attendance and Performance row */}
								<div className="flex justify-between items-center gap-4 bg-accent/20 p-3.5 rounded-xl border border-border">
									<div className="space-y-1">
										<span className="text-xs text-muted-foreground block font-semibold">
											{t('hdwr_altalb')}</span>
										{report.studentAttended ? (
											<span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 rounded-full">
												{t('hdr_aljlsh')}</span>
										) : (
											<span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900 px-2.5 py-1 rounded-full">
												{t('ghab_an_aljlsh')}</span>
										)}
									</div>

									{report.studentAttended && report.studentPerformance && (
										<div className="space-y-1 text-end">
											<span className="text-xs text-muted-foreground block font-semibold">
												{t('adaa_altalb_fy_alhsh')}</span>
											<div className="flex items-center gap-1 justify-end">
												{[1, 2, 3, 4, 5].map((star) => (
													<Star
														key={star}
														size={16}
														fill={
															star <= (report.studentPerformance ?? 0)
																? "currentColor"
																: "none"
														}
														className={
															star <= (report.studentPerformance ?? 0)
																? "text-violet-500"
																: "text-muted-foreground/30"
														}
													/>
												))}
											</div>
										</div>
									)}
								</div>

								{/* Topics Covered */}
								<div className="space-y-1.5">
									<span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
										<BookOpen className="h-4 w-4 text-primary" />
										{t('almwadya_alty_tm_tghtytha')}</span>
									<div className="bg-accent/40 border border-border rounded-xl p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
										{report.topicsCovered}
									</div>
								</div>

								{/* Homework */}
								<div className="space-y-1.5">
									<span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
										<Clock className="h-4 w-4 text-primary" />
										{t('alwajbat_almnzlyh_walmham_almqrrh')}</span>
									<div className="bg-accent/40 border border-border rounded-xl p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
										{report.homeworkAssigned ? (
											report.homeworkAssigned
										) : (
											<span className="text-muted-foreground italic">
												{t('lm_ytm_thdyd_wajbat')}</span>
										)}
									</div>
								</div>

								{/* Teacher Notes */}
								<div className="space-y-1.5">
									<span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
										<FileText className="h-4 w-4 text-primary" />
										{t('mlahdhat_wtwsyat_almalm_lwly')}</span>
									<div className="bg-accent/40 border border-border rounded-xl p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
										{report.teacherNotes ? (
											report.teacherNotes
										) : (
											<span className="text-muted-foreground italic">
												{t('la_twjd_mlahdhat_idafyh')}</span>
										)}
									</div>
								</div>
							</div>

							{/* Footer */}
							<div className="flex justify-end pt-2 border-t border-border">
								<button
									type="button"
									onClick={() => setShowViewReportModal(false)}
									className="text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
								>
									{t('ighlaq_altqryr')}</button>
							</div>
						</div>
					</div>
				</Portal>
			)}

			<DetailsModal
				isOpen={showDetailsModal}
				onClose={() => setShowDetailsModal(false)}
				entityType="booking"
				entityId={booking.id}
			/>
		</div>
	);
}
