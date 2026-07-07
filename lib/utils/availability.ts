import { getErrorT } from "@/lib/i18n/get-server-translations";
import { prisma } from "@/lib/prisma";
import {
	crossesMidnight,
	getDayOfWeekPalestine,
	getLocalTimeString,
} from "@/lib/utils/time";

export async function checkTeacherAvailability(
	teacherId: string,
	startUtc: Date,
	durationMinutes: number,
): Promise<{ available: boolean; reason?: string }> {
    const t = await getErrorT();
	if (crossesMidnight(startUtc, durationMinutes)) {
		return {
			available: false,
			reason: t("availability_same_day_required"),
		};
	}

	const dayOfWeek = getDayOfWeekPalestine(startUtc);
	const localStart = getLocalTimeString(startUtc);
	const endUtc = new Date(startUtc.getTime() + durationMinutes * 60_000);
	const localEnd = getLocalTimeString(endUtc);

	// Fetch all active weekly recurring availabilities for this teacher on this day
	const windows = await prisma.teacherAvailability.findMany({
		where: {
			teacherId,
			dayOfWeek,
			isActive: true,
		},
	});

	// Find a window that completely covers the requested slot [localStart, localEnd]
	const isCovered = windows.some(
		(w) => w.startTime <= localStart && w.endTime >= localEnd,
	);

	if (!isCovered) {
		return {
			available: false,
			reason: t("availability_outside_working_hours"),
		};
	}

	return { available: true };
}

export async function checkConflictingBookings(
	teacherId: string,
	startUtc: Date,
	durationMinutes: number,
): Promise<{ conflict: boolean; reason?: string }> {
    const t = await getErrorT();
	const dayStart = new Date(startUtc);
	dayStart.setUTCHours(0, 0, 0, 0);
	const dayEnd = new Date(startUtc);
	dayEnd.setUTCHours(23, 59, 59, 999);

	const activeBookings = await prisma.booking.findMany({
		where: {
			teacherService: { teacherId },
			status: { in: ["PENDING", "PENDING_APPROVAL", "AWAITING_PAYMENT", "CONFIRMED"] },
			startTime: { gte: dayStart, lte: dayEnd },
		},
	});

	const reqStart = startUtc.getTime();
	const reqEnd = reqStart + durationMinutes * 60_000;

	for (const booking of activeBookings) {
		const bookingStart = booking.startTime.getTime();
		const bookingEnd = bookingStart + booking.duration * 60_000;

		// Overlap condition
		if (reqStart < bookingEnd && bookingStart < reqEnd) {
			return {
				conflict: true,
				reason: t("availability_has_overlap"),
			};
		}
	}

	return { conflict: false };
}
