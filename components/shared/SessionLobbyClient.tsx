"use client";

import {
	AlertCircle,
	ArrowRight,
	CheckCircle2,
	Clock,
	CreditCard,
	Loader2,
	Shield,
	Sparkles,
	Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import JoinMeetingButton from "@/components/shared/JoinMeetingButton";
import { processPayment } from "@/lib/actions/bookings/pay";
import { formatCurrency } from "@/lib/utils/currency";
import { Currency } from "@prisma/client";
import { useTranslations } from "next-intl";

interface SessionLobbyClientProps {
	bookingId: string;
	isParent: boolean;
	paymentStatus: string;
	meetingUrl: string | null;
	teacherName: string;
	studentName: string;
	subject: string;
	price: number;
	currency: Currency;
}

export default function SessionLobbyClient({
	bookingId,
	isParent,
	paymentStatus,
	meetingUrl,
	teacherName,
	studentName,
	subject,
	price,
	currency,
}: SessionLobbyClientProps) {
    const t = useTranslations('common');
	const router = useRouter();
	const [isPaying, setIsPaying] = useState(false);

	// Auto-refresh the page every 5 seconds if payment is UNPAID (to catch when parent pays)
	useEffect(() => {
		if (paymentStatus === "PAID") return;
		const interval = setInterval(() => {
			router.refresh();
		}, 5000);
		return () => clearInterval(interval);
	}, [paymentStatus, router]);

	const handleSimulatePayment = async () => {
		setIsPaying(true);
		toast.loading(t('jary_maaljh_aldfa'), { id: "payment" });

		try {
			const res = await processPayment(bookingId);

			if (res.success) {
				toast.success(t('tm_aldfa_bnjah_jary'), {
					id: "payment",
				});
				router.refresh(); // Refresh to get the Meeting URL
			} else {
				toast.error(res.error || t('hdth_khta_fy_aldfa'), { id: "payment" });
			}
		} catch (error) {
			toast.error(t('khta_fy_alatsal'), { id: "payment" });
		} finally {
			setIsPaying(false);
		}
	};

	const isPaid = paymentStatus === "PAID";

	return (
		<div className="max-w-4xl mx-auto min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Header Avatar Section */}
			<div className="flex items-center justify-center mb-8 relative">
				<div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900 border-4 border-white dark:border-slate-900 z-10 flex items-center justify-center shadow-lg">
					<span className="text-3xl font-black text-indigo-500">
						{teacherName.charAt(0)}
					</span>
				</div>
				<div className="w-20 border-b-4 border-dashed border-slate-300 dark:border-slate-700 -mx-4 z-0"></div>
				<div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900 border-4 border-white dark:border-slate-900 z-10 flex items-center justify-center shadow-lg">
					<span className="text-3xl font-black text-emerald-500">
						{studentName.charAt(0)}
					</span>
				</div>
			</div>

			<h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2">
				{t('ghrfh_aljlsh')}{subject}
			</h1>
			<p className="text-slate-500 mb-10 max-w-lg">
				{t('hthh_hy_ghrfh_alantdhar')}{" "}
				{isParent
					? t('qm_baldfa_llbda_fy')
					: t('bantdhar_itmam_aldfa_lfth')}
				.
			</p>

			{/* Main Status Card */}
			<div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl relative overflow-hidden">
				{/* Background glow based on status */}
				<div
					className={`absolute -top-32 -start-32 w-64 h-64 rounded-full blur-3xl opacity-20 ${isPaid ? "bg-emerald-500" : "bg-amber-500"}`}
				></div>

				<div className="relative z-10 space-y-6">
					{/* Status Badge */}
					<div
						className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
							isPaid
								? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
								: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
						}`}
					>
						{isPaid ? (
							<CheckCircle2 className="w-4 h-4" />
						) : (
							<Clock className="w-4 h-4" />
						)}
						{isPaid ? t('tm_aldfa_aljlsh_jahzh') : t('bantdhar_aldfa')}
					</div>

					{!isPaid ? (
						<div className="space-y-6">
							{isParent ? (
								<>
									<div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
										<p className="text-sm text-slate-500 mb-1">
											{t('almblgh_almtlwb')}</p>
										<p className="text-3xl font-black text-slate-800 dark:text-slate-100">
											{formatCurrency(price, currency)}
										</p>
									</div>

									<button
										onClick={handleSimulatePayment}
										disabled={isPaying}
										className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
									>
										{isPaying ? (
											<Loader2 className="w-5 h-5 animate-spin" />
										) : (
											<CreditCard className="w-5 h-5" />
										)}
										{t('adfa_wabda_aljlsh_alan')}</button>
									<p className="text-xs text-slate-400 mt-2">
										{t('mlahdhh_htha_zr_lmhakah')}</p>
								</>
							) : (
								<div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
									<Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
									<p className="font-bold text-slate-700 dark:text-slate-300">
										{t('nntdhr_wly_alamr')}</p>
									<p className="text-sm text-slate-500 mt-1">
										{t('wly_alamr_alan_fy')}</p>
								</div>
							)}
						</div>
					) : (
						<div className="space-y-6 animate-in zoom-in duration-500">
							<div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
								<p className="text-sm text-emerald-600 dark:text-emerald-400 mb-2">
									{t('rabt_aljlsh_alfwryh_alkhash')}</p>
								{meetingUrl ? (
									<JoinMeetingButton
										bookingId={bookingId}
										variant="giant"
										label={t('adkhl_aljlsh_alan')}
									/>
								) : (
									<div className="flex items-center justify-center gap-2 text-amber-600">
										<AlertCircle className="w-5 h-5" /> {t('jary_twlyd_alrabt_yrja')}</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
