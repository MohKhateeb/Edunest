"use client";

import {
	Calendar,
	CreditCard,
	Eye,
	FileText,
	Star,
	User,
	Video,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import JoinMeetingButton from "@/components/shared/JoinMeetingButton";
import {
	BOOKING_STATUS_AR,
	BOOKING_STATUS_STYLES,
	PAYMENT_METHOD_AR,
	PAYMENT_STATUS_AR,
} from "@/lib/translations";
import type { DetailedBooking } from "@/lib/types";
import { cn, formatLocalTime, formatPrice } from "@/lib/utils";
import {
	canSubmitReport,
	getDetailedSessionState,
	SessionTimeState,
} from "@/lib/utils/booking-state";
import { useTranslations } from "next-intl";

interface BookingDetailsProps {
	booking: DetailedBooking;
	setPreviewImage: (url: string) => void;
}

export default function BookingDetails({
	booking,
	setPreviewImage,
}: BookingDetailsProps) {
    const t = useTranslations('common');
	const isTrial = booking.isTrial;
	const priceDisplay = isTrial
		? t('jlsh_tjrybyh_mjanyh')
		: formatPrice(Number(booking.price));
	const sessionTimeState = getDetailedSessionState(
		booking.startTime,
		booking.duration,
	);

	const report = booking.report;
	const review = booking.review;
	const payment = booking.payment;

	return (
		<div className="space-y-6 text-xs text-muted-foreground">
			{/* Booking Header Overview */}
			<div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex justify-between items-center flex-wrap gap-4 border border-border/50 shadow-sm">
				<div>
					<span className="text-[10px] text-muted-foreground block font-mono">
						{t('rqm_alhjz')}{booking.id.toUpperCase()}
					</span>
					<h3 className="text-base font-extrabold text-foreground mt-0.5">
						{booking.teacherService.serviceType.name}
					</h3>
				</div>
				<div className="flex gap-2">
					<span
						className={cn(
							"px-3 py-1 rounded-full text-xs font-bold border",
							BOOKING_STATUS_STYLES[booking.status as keyof typeof BOOKING_STATUS_STYLES] ?? BOOKING_STATUS_STYLES.PENDING
						)}
					>
						{BOOKING_STATUS_AR[booking.status as keyof typeof BOOKING_STATUS_AR] || booking.status}
					</span>
				</div>
			</div>

			{/* Main Details Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Scheduled Info */}
				<div className="p-5 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm border border-border/50">
					<h4 className="font-black text-sm pb-2 border-b border-border/50 flex items-center gap-1.5 text-foreground">
						<Calendar className="h-4.5 w-4.5 text-primary" />
						{t('twqyt_wtklfh_aljlsh')}</h4>
					<div className="space-y-3">
						<div className="flex justify-between">
							<span>{t('tarykh_wwqt_albda')}</span>
							<strong className="text-foreground bg-primary/5 px-2 py-0.5 rounded-md text-primary">
								{formatLocalTime(booking.startTime)}
							</strong>
						</div>
						<div className="flex justify-between">
							<span>{t('mdh_alhsh')}</span>
							<strong className="text-foreground">
								{booking.duration} {t('dqyqh')}</strong>
						</div>
						<div className="flex justify-between">
							<span>{t('altklfh_alijmalyh')}</span>
							<strong className="text-foreground text-sm text-primary font-black">
								{priceDisplay}
							</strong>
						</div>
						{booking.bookingSource && (
							<div className="flex justify-between">
								<span>{t('msdr_alhjz')}</span>
								<strong className="text-foreground">
									{booking.bookingSource === "ADMIN" ? t('idary') : t('alwyb')}
								</strong>
							</div>
						)}
					</div>
				</div>

				{/* Client & Tutor Info */}
				<div className="p-5 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm border border-border/50">
					<h4 className="font-black text-sm pb-2 border-b border-border/50 flex items-center gap-1.5 text-foreground">
						<User className="h-4.5 w-4.5 text-secondary" />
						{t('atraf_aljlsh_altalymyh')}</h4>
					<div className="space-y-2">
						<div className="flex justify-between">
							<span>{t('altalb_almstfyd')}</span>
							<strong className="text-foreground">
								{booking.student.name} {t('alsf_1')}{booking.student.grade})
							</strong>
						</div>
						<div className="flex justify-between">
							<span>{t('wly_alamr_1')}</span>
							<strong className="text-foreground">{booking.parent.name}</strong>
						</div>
						<div className="flex justify-between items-center">
							<span>{t('almalm_alkhswsy')}</span>
							<div className="flex items-center gap-2">
								<div className="relative h-6 w-6 rounded-full overflow-hidden bg-accent border border-border flex-shrink-0">
									{booking.teacherService.teacher.profileImageUrl ? (
										<img
											src={booking.teacherService.teacher.profileImageUrl}
											alt={booking.teacherService.teacher.user.name}
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="h-full w-full flex items-center justify-center text-primary font-bold text-[10px] bg-primary/10">
											{booking.teacherService.teacher.user.name.charAt(0)}
										</div>
									)}
								</div>
								<strong className="text-foreground">
									{booking.teacherService.teacher.user.name}
								</strong>
							</div>
						</div>
						{booking.parent.phone && (
							<div className="flex justify-between">
								<span>{t('rqm_hatf_wly_alamr')}</span>
								<strong className="text-foreground">
									{booking.parent.phone}
								</strong>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Payment Information */}
			{!isTrial && (
				<div className="p-5 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm border border-border/50">
					<h4 className="font-black text-sm pb-2 border-b border-border/50 flex items-center gap-1.5 text-foreground">
						<CreditCard className="h-4.5 w-4.5 text-emerald-500" />
						{t('halh_aldfa_wtakyd_alrswm')}</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<div className="flex justify-between">
								<span>{t('halh_althwyl')}</span>
								<strong
									className={cn(
										"font-bold",
										booking.paymentStatus === "PAID" && "text-emerald-600",
										booking.paymentStatus === "UNPAID" && "text-rose-600",
									)}
								>
									{
										PAYMENT_STATUS_AR[
											booking.paymentStatus as keyof typeof PAYMENT_STATUS_AR
										]
									}
								</strong>
							</div>
							{payment?.method && (
								<div className="flex justify-between">
									<span>{t('tryqh_althwyl')}</span>
									<strong className="text-foreground">
										{
											PAYMENT_METHOD_AR[
												payment.method as keyof typeof PAYMENT_METHOD_AR
											]
										}
									</strong>
								</div>
							)}
							{payment?.paidAt && (
								<div className="flex justify-between">
									<span>{t('tarykh_takyd_althwyl')}</span>
									<strong className="text-foreground">
										{new Date(payment.paidAt).toLocaleDateString("ar-EG")}
									</strong>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Meeting URL */}
			{booking.status === "CONFIRMED" && (
				<div className="p-4 border border-border bg-card rounded-xl space-y-2">
					<span className="font-bold text-primary block text-[11px]">
						{t('rabt_alqaah_alaftradyh_jitsi')}</span>

					{sessionTimeState.status === "active" ||
					sessionTimeState.status === "ready_to_join" ||
					sessionTimeState.status === "grace_period" ? (
						<div className="flex items-center justify-between gap-4 flex-wrap bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/40 p-3 rounded-lg">
							<span className="text-[11px] text-emerald-800 dark:text-emerald-400">
								{t('alqaah_alaftradyh_jahzh_llthdyr')}</span>
							<JoinMeetingButton
								bookingId={booking.id}
								variant="small"
								label={t('andm_lljlsh_qaah_wyb')}
							/>
						</div>
					) : sessionTimeState.status === "upcoming" ? (
						<div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 border border-border p-3 rounded-lg">
							<span className="text-[11px] text-muted-foreground font-medium">
								{t('sydhhr_rabt_aldkhwl_alkhas')}</span>
						</div>
					) : (
						<div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 border border-border p-3 rounded-lg">
							<span className="text-[11px] text-muted-foreground font-medium">
								{t('antha_wqt_aljlsh_rabt')}</span>
						</div>
					)}
				</div>
			)}

			{/* Notes Box */}
			{(booking.parentNotes ||
				booking.teacherNotes ||
				booking.cancellationReason ||
				booking.questionTitle) && (
				<div className="space-y-3">
					{booking.questionTitle && (
						<div className="p-4 border border-border bg-background rounded-xl">
							<span className="font-bold text-primary block mb-1">
								{t('mwdwa_aljlsh')}</span>
							<p className="text-foreground/80 leading-relaxed font-semibold">
								{booking.questionTitle}
							</p>
							{booking.questionDetails && (
								<p className="text-foreground/70 leading-relaxed mt-2 text-xs">
									{booking.questionDetails}
								</p>
							)}
						</div>
					)}
					{booking.parentNotes && (
						<div className="p-4 border border-border bg-accent/20 rounded-xl">
							<span className="font-bold text-foreground/80 block mb-1">
								{t('mlahdhat_hjz_wly_alamr')}</span>
							<p className="text-foreground/75 leading-relaxed italic">
								"{booking.parentNotes}"
							</p>
						</div>
					)}
					{booking.teacherNotes && (
						<div className="p-4 border border-border bg-accent/20 rounded-xl">
							<span className="font-bold text-foreground/80 block mb-1">
								{t('mlahdhat_almalm')}</span>
							<p className="text-foreground/75 leading-relaxed italic">
								"{booking.teacherNotes}"
							</p>
						</div>
					)}
					{booking.cancellationReason && (
						<div className="p-4 border border-destructive/20 bg-destructive/5 rounded-xl text-destructive">
							<span className="font-bold block mb-1 text-xs">
								{t('sbb_ilghaa_aljlsh')}</span>
							<p className="leading-relaxed italic">
								"{booking.cancellationReason}"
							</p>
						</div>
					)}
				</div>
			)}

			{/* Completed Session Report Details */}
			{booking.status === "COMPLETED" && report && (
				<div className="p-5 border border-primary/20 bg-primary/5 rounded-xl space-y-4">
					<h4 className="font-extrabold text-sm border-b border-primary/10 pb-2 text-primary flex items-center gap-1">
						<FileText className="h-4.5 w-4.5" />
						{t('tqryr_anthaa_aljlsh_altalymyh')}</h4>
					<div className="space-y-3 text-xs">
						<div className="flex justify-between items-center bg-card border border-border p-3 rounded-lg">
							<div>
								<span className="text-muted-foreground block text-[10px]">
									{t('hdwr_altalb_1')}</span>
								<strong
									className={
										report.studentAttended
											? "text-emerald-600 font-bold"
											: "text-rose-500 font-bold"
									}
								>
									{report.studentAttended ? t('hdr_aljlsh') : t('ghab_an_aljlsh')}
								</strong>
							</div>
							{report.studentAttended && report.studentPerformance && (
								<div className="text-start">
									<span className="text-muted-foreground block text-[10px]">
										{t('tqyym_adaa_altalb')}</span>
									<div className="flex justify-end items-center gap-0.5 mt-0.5">
										{[1, 2, 3, 4, 5].map((s: number) => (
											<Star
												key={s}
												size={12}
												fill={
													s <= report.studentPerformance!
														? "currentColor"
														: "none"
												}
												className={
													s <= report.studentPerformance!
														? "text-violet-500"
														: "text-muted-foreground/35"
												}
											/>
										))}
									</div>
								</div>
							)}
						</div>

						<div>
							<span className="font-bold text-foreground/80 block mb-1">
								{t('almwadya_waldrws_alty_tm')}</span>
							<p className="bg-card border border-border p-3 rounded-lg text-foreground/75 leading-relaxed whitespace-pre-wrap">
								{report.topicsCovered}
							</p>
						</div>

						{report.homeworkAssigned && (
							<div>
								<span className="font-bold text-foreground/80 block mb-1">
									{t('alwajbat_waltdrybat_almnzlyh_almqrrh')}</span>
								<p className="bg-card border border-border p-3 rounded-lg text-foreground/75 leading-relaxed whitespace-pre-wrap">
									{report.homeworkAssigned}
								</p>
							</div>
						)}

						{report.teacherNotes && (
							<div>
								<span className="font-bold text-foreground/80 block mb-1">
									{t('twsyat_wmlahdhat_almalm_llahaly')}</span>
								<p className="bg-card border border-border p-3 rounded-lg text-foreground/75 leading-relaxed whitespace-pre-wrap">
									{report.teacherNotes}
								</p>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Review Info */}
			{booking.status === "COMPLETED" && review && (
				<div className="p-4 border border-violet-500/20 bg-violet-500/5 rounded-xl space-y-2">
					<span className="font-bold text-violet-600 dark:text-violet-400 block text-xs">
						{t('tqyym_wly_alamr_llmalm')}</span>
					<div className="flex items-center gap-1 mt-1">
						{[1, 2, 3, 4, 5].map((s: number) => (
							<Star
								key={s}
								size={14}
								fill={s <= review.rating ? "currentColor" : "none"}
								className={
									s <= review.rating
										? "text-violet-500"
										: "text-muted-foreground/35"
								}
							/>
						))}
						<span className="text-[10px] text-muted-foreground me-2">
							({review.rating} {t('mn_5')}</span>
					</div>
					{review.comment && (
						<p className="text-foreground/75 italic leading-relaxed pt-1">
							"{review.comment}"
						</p>
					)}
				</div>
			)}
		</div>
	);
}
