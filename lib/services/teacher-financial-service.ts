import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { Prisma, UserType } from "@prisma/client";
import { calculateEarnings } from "@/lib/utils/financial";

export type TeacherFinancialBooking = Prisma.BookingGetPayload<{
	include: {
		dispute: true;
		student: true;
		teacherService: { include: { serviceType: true } };
	};
}>;

export type TeacherPayoutWithDetails = Prisma.TeacherPayoutGetPayload<{
	// Base payout, no complex includes needed here
}>;

export type TeacherEarningsWallet = {
	teacher: Prisma.TeacherGetPayload<{ include: { user: true } }>;
	payouts: TeacherPayoutWithDetails[];
	totalPaid: number;
	totalPendingPayouts: number;
	availableToPayout: number;
	heldAmount: number;
	disputedBookings: TeacherFinancialBooking[];
	normalBookings: TeacherFinancialBooking[];
};

export async function getTeacherEarningsWallet(
	userId: string,
): Promise<TeacherEarningsWallet> {
	await requireAuth([UserType.TEACHER]);

	const teacher = await prisma.teacher.findUnique({
		where: { userId },
		include: { user: true },
	});

	if (!teacher) {
		throw new Error("حدث خطأ، لا يوجد ملف معلم.");
	}

	const payouts = await prisma.teacherPayout.findMany({
		where: { teacherId: teacher.id },
		orderBy: { createdAt: "desc" },
	});

	let totalPaid = 0;
	let totalPendingPayouts = 0;

	for (const p of payouts) {
		if (p.isPaid) totalPaid += Number(p.netAmount);
		else totalPendingPayouts += Number(p.netAmount);
	}

	const twentyFourHoursAgo = new Date();
	twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

	const rawBookings = await prisma.booking.findMany({
		where: {
			teacherService: { teacherId: teacher.id },
			status: "COMPLETED",
			OR: [{ paymentStatus: { in: ["PAID", "REFUNDED"] } }, { isTrial: true }],
		},
		include: {
			dispute: true,
			student: true,
			teacherService: { include: { serviceType: true } },
		},
		orderBy: { completedAt: "desc" },
		take: 100,
	});

	let availableToPayout = 0;
	let heldAmount = 0;
	const disputedBookings: TeacherFinancialBooking[] = [];
	const normalBookings: TeacherFinancialBooking[] = [];

	for (const b of rawBookings) {
		if (b.dispute) {
			disputedBookings.push(b);
		} else {
			normalBookings.push(b);
		}

		if (b.payoutId !== null) continue;

		const earnings = calculateEarnings(
			Number(b.price),
			Number(b.appliedCommissionRate),
			b.isTrial,
			Number(b.trialCostToPlatform),
		);
		const net = earnings.teacherTotalEarnings;

		if (b.dispute && b.dispute.status !== "RESOLVED_IN_FAVOR_OF_TEACHER") {
			if (b.dispute.status === "OPEN") heldAmount += net;
			continue;
		}

		if (b.completedAt && b.completedAt > twentyFourHoursAgo) {
			heldAmount += net;
		} else {
			availableToPayout += net;
		}
	}

	disputedBookings.sort((a, b) => {
		if (a.dispute!.status === "OPEN" && b.dispute!.status !== "OPEN") return -1;
		if (b.dispute!.status === "OPEN" && a.dispute!.status !== "OPEN") return 1;
		return (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0);
	});

	return {
		teacher,
		payouts,
		totalPaid,
		totalPendingPayouts,
		availableToPayout,
		heldAmount,
		disputedBookings,
		normalBookings,
	};
}
