import { getErrorT } from "@/lib/i18n/get-server-translations";
import { UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getAuthorizedBooking(
	bookingId: string,
	userId: string,
	userType: UserType,
) {
	const booking = await prisma.booking.findUnique({
		where: { id: bookingId },
		include: {
			teacherService: { include: { teacher: true } },
			parent: true,
			payment: true,
		},
	});

	if (!booking) {
		throw new Error(await (async () => { const t = await getErrorT(); return t("booking_not_found_or_unavailable"); })());
	}

	if (userType === UserType.PARENT && booking.parentUserId !== userId) {
		throw new Error(await (async () => { const t = await getErrorT(); return t("booking_unauthorized_edit"); })());
	}

	if (
		userType === UserType.TEACHER &&
		booking.teacherService.teacher.userId !== userId
	) {
		throw new Error(await (async () => { const t = await getErrorT(); return t("booking_unauthorized_edit"); })());
	}

	return booking;
}
