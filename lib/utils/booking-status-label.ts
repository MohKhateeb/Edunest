import type { BookingStatus } from "@prisma/client";

export function getBookingStatusLabel(status: BookingStatus, t: (key: string) => string): string {
	switch (status) {
		case "PENDING":
			return t("booking_status_pending");
		case "PENDING_APPROVAL":
			return t("booking_status_pending_approval");
		case "AWAITING_PAYMENT":
			return t("booking_status_awaiting_payment");
		case "CONFIRMED":
			return t("booking_status_confirmed");
		case "COMPLETED":
			return t("booking_status_completed");
		case "REJECTED":
			return t("booking_status_rejected");
		case "CANCELLED":
			return t("booking_status_cancelled");
		case "EXPIRED":
			return t("booking_status_expired");
		default:
			return status;
	}
}
