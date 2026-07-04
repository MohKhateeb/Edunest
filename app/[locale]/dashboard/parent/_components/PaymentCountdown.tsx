import { useTranslations } from "next-intl";

"use client";

import { useState, useEffect } from "react";
import { CreditCard, Clock } from "lucide-react";
import { PaymentModal } from "@/components/shared/PaymentModal";
import Portal from "@/components/shared/Portal";

interface PaymentCountdownProps {
	bookingId: string;
	price: number;
	paymentDeadline?: Date | string | null;
}

export default function PaymentCountdown({
	bookingId,
	price,
	paymentDeadline,
}: PaymentCountdownProps) {
    const t = useTranslations('parent')
	const [timeLeft, setTimeLeft] = useState<string>("");
	const [isExpired, setIsExpired] = useState<boolean>(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);

	useEffect(() => {
		if (!paymentDeadline) return;

		const deadline = new Date(paymentDeadline).getTime();

		const updateTimer = () => {
			const now = new Date().getTime();
			const diff = deadline - now;

			if (diff <= 0) {
				setTimeLeft(t('key_1783109435474_pipk'));
				setIsExpired(true);
				return;
			}

			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diff % (1000 * 60)) / 1000);
			setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [paymentDeadline]);

	return (
		<div className="w-full flex flex-col gap-2 animate-in fade-in">
			<div className="flex items-center justify-center gap-1.5 text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900 py-2.5 px-3 rounded-xl transition-colors">
				<Clock className="h-4 w-4 shrink-0" />
				{isExpired ? (
					<span>{t('key_1783109435474_pipk')}</span>
				) : (
					<span>{t('key_1783109435478_s3ww')}{timeLeft}</span>
				)}
			</div>

			{!isExpired && (
				<button
					onClick={() => setShowPaymentModal(true)}
					className="w-full flex items-center justify-center gap-1.5 text-xs font-bold bg-orange-600 text-white border border-orange-700 hover:bg-orange-700 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg animate-pulse hover:animate-none"
				>
					<CreditCard className="h-4 w-4" />
					{t('key_1783109435481_cmyd')}{price})
				</button>
			)}

			{showPaymentModal && (
				<Portal>
					<PaymentModal
						bookingId={bookingId}
						price={price}
						onClose={() => setShowPaymentModal(false)}
					/>
				</Portal>
			)}
		</div>
	);
}
