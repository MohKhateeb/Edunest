import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBooking } from "@/lib/actions/booking";

interface BookingSubmissionOptions {
	onSuccess?: () => void;
	onError?: (msg: string) => void;
}

export function useBookingSubmission(options?: BookingSubmissionOptions) {
	const t = useTranslations("errors");
	const locale = useLocale();
	const router = useRouter();
	const bookingsPath = locale === "ar" ? "/dashboard/parent/bookings" : `/en/dashboard/parent/bookings`;
	const [createdBooking, setCreatedBooking] = useState<{
		id: string;
		price: number;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const submitBooking = async (payload: {
		studentId: string;
		teacherServiceId: string;
		startTime: Date;
		isTrial: boolean;
		questionTitle?: string;
		questionDetails?: string;
		questionImageUrl?: string;
		parentNotes?: string;
		price: number;
	}) => {
		setLoading(true);
		setErrorMsg(null);

		try {
			const res = await createBooking({
				studentId: payload.studentId,
				teacherServiceId: payload.teacherServiceId,
				startTime: payload.startTime,
				isTrial: payload.isTrial,
				questionTitle: payload.questionTitle,
				questionDetails: payload.questionDetails,
				questionImageUrl: payload.questionImageUrl,
				parentNotes: payload.parentNotes,
				paymentMethod: "ONLINE_CARD",
			});

			if (res.success) {
				setSuccess(true);
				setTimeout(() => {
					router.push(bookingsPath);
				}, 2000);
				options?.onSuccess?.();
			} else {
				setErrorMsg(res.error || t("booking_unknown_error"));
				options?.onError?.(res.error || t("booking_unknown_error"));
			}
		} catch (err: unknown) {
			console.error(err);
			setErrorMsg(t("booking_unexpected_error"));
			options?.onError?.(t("booking_unexpected_error"));
		} finally {
			setLoading(false);
		}
	};

	const closePaymentModal = () => {
		setCreatedBooking(null);
		setSuccess(true);
		setTimeout(() => {
			router.push(bookingsPath);
		}, 1500);
	};

	return {
		createdBooking,
		loading,
		errorMsg,
		setErrorMsg,
		success,
		submitBooking,
		closePaymentModal,
	};
}
