"use client";

import { useState } from "react";
import { DisputeModal } from "./DisputeModal";
import { PaymentModal } from "./PaymentModal";
import { useTranslations } from "next-intl";

export function PaymentAction({
	bookingId,
	price,
}: {
	bookingId: string;
	price: number;
}) {
    const t = useTranslations('common');
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
			>
				{t('dfa_alan')}</button>
			{isOpen && (
				<PaymentModal
					bookingId={bookingId}
					price={price}
					onClose={() => setIsOpen(false)}
				/>
			)}
		</>
	);
}

export function DisputeAction({ bookingId }: { bookingId: string }) {
    const t = useTranslations('common');
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors border border-red-200 dark:border-red-900/50"
			>
				{t('tqdym_aatrad')}</button>
			{isOpen && (
				<DisputeModal bookingId={bookingId} onClose={() => setIsOpen(false)} />
			)}
		</>
	);
}
