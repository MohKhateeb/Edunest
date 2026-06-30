"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface PaymentCountdownProps {
	deadline: Date;
	className?: string;
}

export function PaymentCountdownReadOnly({
	deadline,
	className = "",
}: PaymentCountdownProps) {
	const [timeLeft, setTimeLeft] = useState<string>("");

	useEffect(() => {
		const calculateTimeLeft = () => {
			const now = new Date().getTime();
			const target = new Date(deadline).getTime();
			const difference = target - now;

			if (difference <= 0) {
				return "انتهى الوقت";
			}

			const hours = Math.floor(difference / (1000 * 60 * 60));
			const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

			if (hours > 0) {
				return `${hours} ساعة و ${minutes} دقيقة`;
			}
			return `${minutes} دقيقة`;
		};

		setTimeLeft(calculateTimeLeft());
		const timer = setInterval(() => {
			setTimeLeft(calculateTimeLeft());
		}, 60000);

		return () => clearInterval(timer);
	}, [deadline]);

	if (!timeLeft) return null;

	const isExpired = timeLeft === "انتهى الوقت";

	return (
		<div
			className={`flex items-center justify-center gap-1.5 text-xs font-bold ${isExpired ? "text-red-500" : "text-amber-600"} ${className}`}
		>
			<Clock className="w-3.5 h-3.5" />
			<span dir="rtl">
				{isExpired ? "انتهى وقت الدفع" : `متبقي للدفع: ${timeLeft}`}
			</span>
		</div>
	);
}
