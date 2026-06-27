import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { UserType } from "@prisma/client";

export type AdminFinancialStats = {
	openDisputesCount: number;
	pendingPayoutsCount: number;
	totalRevenue: number;
	totalCommission: number;
};

export async function getAdminFinancialStats(): Promise<AdminFinancialStats> {
	await requireAuth([UserType.ADMIN]);

	const openDisputesCount = await prisma.dispute.count({
		where: { status: "OPEN" },
	});

	const pendingPayoutsCount = await prisma.teacherPayout.count({
		where: { isPaid: false },
	});

	// Fetch only necessary fields to calculate revenue and commission
	const completedBookings = await prisma.booking.findMany({
		where: { status: "COMPLETED" },
		select: { price: true, appliedCommissionRate: true },
	});

	let totalRevenue = 0;
	let totalCommission = 0;

	for (const booking of completedBookings) {
		const price = Number(booking.price);
		const rate = Number(booking.appliedCommissionRate);
		totalRevenue += price;
		totalCommission += (price * rate) / 100;
	}

	return {
		openDisputesCount,
		pendingPayoutsCount,
		totalRevenue,
		totalCommission,
	};
}
