"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatDuration } from "@/lib/utils";

interface PaymentCountdownProps {
	deadline: Date;
	className?: string;
}

export function PaymentCountdownReadOnly({
	deadline,
	className = "",
}: PaymentCountdownProps) {
    const t = useTranslations('common');
	const locale = useLocale();
	const [timeLeft, setTimeLeft] = useState<string>("");

	useEffect(() => {
		const calculateTimeLeft = () => {
			const now = new Date().getTime();
			const target = new Date(deadline).getTime();
			const difference = target - now;

			if (difference <= 0) {
				return t('antha_alwqt');
			}

			const totalMinutes = Math.floor(difference / (1000 * 60));
			return formatDuration(totalMinutes, locale);
		};

		setTimeLeft(calculateTimeLeft());
		const timer = setInterval(() => {
			setTimeLeft(calculateTimeLeft());
		}, 60000);

		return () => clearInterval(timer);
	}, [deadline, locale, t]);

	if (!timeLeft) return null;

	const isExpired = timeLeft === t('antha_alwqt');

	return (
		<div
			className={`flex items-center justify-center gap-1.5 text-xs font-bold ${isExpired ? "text-red-500" : "text-amber-600"} ${className}`}
		>
			<Clock className="w-3.5 h-3.5" />
			<span>
				{isExpired ? t('antha_wqt_aldfa') : `متبقي للدفع: ${timeLeft}`}
			</span>
		</div>
	);
}
