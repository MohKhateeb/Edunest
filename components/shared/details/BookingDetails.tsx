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

interface BookingDetailsProps {
	booking: DetailedBooking;
	setPreviewImage: (url: string) => void;
}

export default function BookingDetails({
	booking,
	setPreviewImage,
}: BookingDetailsProps) {
	const isTrial = booking.isTrial;
	const priceDisplay = isTrial
		? "جلسة تجريبية مجانية"
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
						رقم الحجز: #{booking.id.toUpperCase()}
					</span>
					<h3 className="text-base font-extrabold text-foreground mt-0.5">
						{booking.teacherService.serviceType.name}
					</h3>
				</div>
				<div className="flex gap-2">
					<span
						className={cn(
							"px-3 py-1 rounded-full text-xs font-bold border",
							booking.status === "CONFIRMED" &&
								"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800",
							booking.status === "PENDING" &&
								"bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-800",
							booking.status === "COMPLETED" &&
								"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800",
							booking.status === "CANCELLED" &&
								"bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
							booking.status === "REJECTED" &&
								"bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800",
						)}
					>
						{
							BOOKING_STATUS_AR[
								booking.status as keyof typeof BOOKING_STATUS_AR
							]
						}
					</span>
				</div>
			</div>

			{/* Main Details Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Scheduled Info */}
				<div className="p-5 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm border border-border/50">
					<h4 className="font-black text-sm pb-2 border-b border-border/50 flex items-center gap-1.5 text-foreground">
						<Calendar className="h-4.5 w-4.5 text-primary" />
						توقيت وتكلفة الجلسة
					</h4>
					<div className="space-y-3">
						<div className="flex justify-between">
							<span>تاريخ ووقت البدء:</span>
							<strong className="text-foreground bg-primary/5 px-2 py-0.5 rounded-md text-primary">
								{formatLocalTime(booking.startTime)}
							</strong>
						</div>
						<div className="flex justify-between">
							<span>مدة الحصة:</span>
							<strong className="text-foreground">
								{booking.duration} دقيقة
							</strong>
						</div>
						<div className="flex justify-between">
							<span>التكلفة الإجمالية:</span>
							<strong className="text-foreground text-sm text-primary font-black">
								{priceDisplay}
							</strong>
						</div>
						{booking.bookingSource && (
							<div className="flex justify-between">
								<span>مصدر الحجز:</span>
								<strong className="text-foreground">
									{booking.bookingSource === "ADMIN" ? "إداري" : "الويب"}
								</strong>
							</div>
						)}
					</div>
				</div>

				{/* Client & Tutor Info */}
				<div className="p-5 bg-white dark:bg-slate-900 rounded-2xl space-y-4 shadow-sm border border-border/50">
					<h4 className="font-black text-sm pb-2 border-b border-border/50 flex items-center gap-1.5 text-foreground">
						<User className="h-4.5 w-4.5 text-secondary" />
						أطراف الجلسة التعليمية
					</h4>
					<div className="space-y-2">
						<div className="flex justify-between">
							<span>الطالب المستفيد:</span>
							<strong className="text-foreground">
								{booking.student.name} (الصف {booking.student.grade})
							</strong>
						</div>
						<div className="flex justify-between">
							<span>ولي الأمر:</span>
							<strong className="text-foreground">{booking.parent.name}</strong>
						</div>
						<div className="flex justify-between items-center">
							<span>المعلم الخصوصي:</span>
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
								<span>رقم هاتف ولي الأمر:</span>
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
						حالة الدفع وتأكيد الرسوم
					</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<div className="flex justify-between">
								<span>حالة التحويل:</span>
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
									<span>طريقة التحويل:</span>
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
									<span>تاريخ تأكيد التحويل:</span>
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
						رابط القاعة الافتراضية (Jitsi Meet):
					</span>

					{sessionTimeState.status === "active" ||
					sessionTimeState.status === "ready_to_join" ||
					sessionTimeState.status === "grace_period" ? (
						<div className="flex items-center justify-between gap-4 flex-wrap bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/40 p-3 rounded-lg">
							<span className="text-[11px] text-emerald-800 dark:text-emerald-400">
								القاعة الافتراضية جاهزة للتحضير والدخول.
							</span>
							<JoinMeetingButton
								bookingId={booking.id}
								variant="small"
								label="انضم للجلسة (قاعة ويب)"
							/>
						</div>
					) : sessionTimeState.status === "upcoming" ? (
						<div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 border border-border p-3 rounded-lg">
							<span className="text-[11px] text-muted-foreground font-medium">
								سيظهر رابط الدخول الخاص بك هنا قبل بدء الجلسة بـ 5 دقائق.
							</span>
						</div>
					) : (
						<div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 border border-border p-3 rounded-lg">
							<span className="text-[11px] text-muted-foreground font-medium">
								انتهى وقت الجلسة. رابط القاعة غير متاح حالياً.
							</span>
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
								موضوع الجلسة:
							</span>
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
								ملاحظات حجز ولي الأمر:
							</span>
							<p className="text-foreground/75 leading-relaxed italic">
								"{booking.parentNotes}"
							</p>
						</div>
					)}
					{booking.teacherNotes && (
						<div className="p-4 border border-border bg-accent/20 rounded-xl">
							<span className="font-bold text-foreground/80 block mb-1">
								ملاحظات المعلم:
							</span>
							<p className="text-foreground/75 leading-relaxed italic">
								"{booking.teacherNotes}"
							</p>
						</div>
					)}
					{booking.cancellationReason && (
						<div className="p-4 border border-destructive/20 bg-destructive/5 rounded-xl text-destructive">
							<span className="font-bold block mb-1 text-xs">
								سبب إلغاء الجلسة:
							</span>
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
						تقرير انتهاء الجلسة التعليمية المرفوع
					</h4>
					<div className="space-y-3 text-xs">
						<div className="flex justify-between items-center bg-card border border-border p-3 rounded-lg">
							<div>
								<span className="text-muted-foreground block text-[10px]">
									حضور الطالب:
								</span>
								<strong
									className={
										report.studentAttended
											? "text-emerald-600 font-bold"
											: "text-rose-500 font-bold"
									}
								>
									{report.studentAttended ? "✓ حضر الجلسة" : "✗ غاب عن الجلسة"}
								</strong>
							</div>
							{report.studentAttended && report.studentPerformance && (
								<div className="text-left">
									<span className="text-muted-foreground block text-[10px]">
										تقييم أداء الطالب:
									</span>
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
								المواضيع والدروس التي تم شرحها:
							</span>
							<p className="bg-card border border-border p-3 rounded-lg text-foreground/75 leading-relaxed whitespace-pre-wrap">
								{report.topicsCovered}
							</p>
						</div>

						{report.homeworkAssigned && (
							<div>
								<span className="font-bold text-foreground/80 block mb-1">
									الواجبات والتدريبات المنزلية المقررة:
								</span>
								<p className="bg-card border border-border p-3 rounded-lg text-foreground/75 leading-relaxed whitespace-pre-wrap">
									{report.homeworkAssigned}
								</p>
							</div>
						)}

						{report.teacherNotes && (
							<div>
								<span className="font-bold text-foreground/80 block mb-1">
									توصيات وملاحظات المعلم للأهالي:
								</span>
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
						تقييم ولي الأمر للمعلم:
					</span>
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
							({review.rating} من 5)
						</span>
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
