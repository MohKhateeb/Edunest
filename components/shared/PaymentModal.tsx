"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BaseModal from "@/components/shared/BaseModal";
import { processPayment } from "@/lib/actions/bookings/pay";
import { useTranslations } from "next-intl";

export function PaymentModal({
	bookingId,
	price,
	onClose,
}: {
	bookingId: string;
	price: number;
	onClose: () => void;
}) {
    const t = useTranslations('common');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	const handlePay = async () => {
		setLoading(true);
		setError("");

		// محاكاة عملية الدفع عبر بوابة الدفع الوهمية
		const res = await processPayment(bookingId);

		if (res.success) {
			router.refresh();
			onClose();
		} else {
			setError(res.error || t('hdth_khta_athnaa_maaljh'));
			setLoading(false);
		}
	};

	return (
		<BaseModal onClose={onClose} className="max-w-md overflow-hidden">
			{/* Decorative Header */}
			<div className="absolute top-0 start-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

			<div className="text-center mb-6 mt-2">
				<div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg
						className="w-8 h-8"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
						></path>
					</svg>
				</div>
				<h3 className="text-xl font-bold text-gray-900 dark:text-white">
					{t('takyd_amlyh_aldfa')}</h3>
				<p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
					{t('sytm_khsm_almblgh_mn')}</p>
			</div>

			<div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
				<div className="flex justify-between items-center mb-2">
					<span className="text-gray-600 dark:text-gray-300">{t('qymh_aljlsh')}</span>
					<span className="font-semibold text-gray-900 dark:text-white">
						{price} {t('shykl_1')}</span>
				</div>
				<div className="flex justify-between items-center mb-2">
					<span className="text-gray-600 dark:text-gray-300">{t('rswm_idafyh')}</span>
					<span className="font-semibold text-gray-900 dark:text-white">
						{t('0_shykl')}</span>
				</div>
				<div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-2 flex justify-between items-center">
					<span className="text-gray-900 dark:text-white font-bold">
						{t('alijmaly')}</span>
					<span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
						{price} {t('shykl_1')}</span>
				</div>
			</div>

			{error && (
				<div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
					{error}
				</div>
			)}

			<div className="space-y-3">
				<button
					onClick={handlePay}
					disabled={loading}
					className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex justify-center items-center gap-2 disabled:opacity-70"
				>
					{loading ? (
						<>
							<svg
								className="animate-spin -ms-1 me-3 h-5 w-5 text-white"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							{t('jary_almaaljh')}</>
					) : (
						t('dfa_wtakyd_alhjz')
					)}
				</button>

				<button
					onClick={onClose}
					disabled={loading}
					className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
				>
					{t('cancel')}</button>
			</div>
		</BaseModal>
	);
}
