import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBooking } from "@/lib/actions/booking";

interface BookingSubmissionOptions {
	onSuccess?: () => void;
	onError?: (msg: string) => void;
}

export function useBookingSubmission(options?: BookingSubmissionOptions) {
	const router = useRouter();
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
				if (payload.isTrial) {
					setSuccess(true);
					setTimeout(() => {
						router.push("/dashboard/parent/bookings");
					}, 2000);
				} else if (res.data) {
					setCreatedBooking({ id: res.data.bookingId, price: payload.price });
				}
				options?.onSuccess?.();
			} else {
				setErrorMsg(res.error || "حدث خطأ غير معروف");
				options?.onError?.(res.error || "حدث خطأ غير معروف");
			}
		} catch (err: unknown) {
			console.error(err);
			setErrorMsg("حدث خطأ غير متوقع أثناء إتمام الحجز");
			options?.onError?.("حدث خطأ غير متوقع أثناء إتمام الحجز");
		} finally {
			setLoading(false);
		}
	};

	const closePaymentModal = () => {
		setCreatedBooking(null);
		setSuccess(true);
		setTimeout(() => {
			router.push("/dashboard/parent/bookings");
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
