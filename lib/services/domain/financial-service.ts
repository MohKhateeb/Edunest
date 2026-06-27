import { type Prisma, UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { calculateEarnings } from "@/lib/utils/financial";

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

export async function getAdminOpenDisputes() {
	await requireAuth([UserType.ADMIN]);
	return prisma.dispute.findMany({
		where: { status: "OPEN" },
		include: {
			booking: {
				include: {
					student: true,
					parent: true,
					teacherService: { include: { teacher: { include: { user: true } } } },
				},
			},
		},
		orderBy: { createdAt: "asc" },
		take: 5,
	});
}

export async function getAdminPendingPayouts() {
	await requireAuth([UserType.ADMIN]);
	return prisma.teacherPayout.findMany({
		where: { isPaid: false },
		include: { teacher: { include: { user: true } } },
		orderBy: { createdAt: "asc" },
		take: 5,
	});
}

export type ParentFinancialBooking = Omit<
	Prisma.BookingGetPayload<{
		include: {
			teacherService: {
				include: {
					teacher: { include: { user: true } };
					serviceType: true;
				};
			};
			student: true;
			payment: true;
			dispute: true;
			parentRefund: true;
		};
	}>,
	"price"
> & { price: number; canDispute: boolean };

export type ParentFinancialStats = {
	bookings: ParentFinancialBooking[];
	totalSpent: number;
	totalRefunded: number;
	teachers: { id: string; name: string }[];
};

export async function getParentFinancials(
	userId: string,
	dateFilter?: string,
	teacherFilter?: string,
): Promise<ParentFinancialStats> {
	await requireAuth([UserType.PARENT]);

	const whereClause: Prisma.BookingWhereInput = {
		parentUserId: userId,
	};

	if (dateFilter) {
		const start = new Date(dateFilter);
		const end = new Date(dateFilter);
		end.setHours(23, 59, 59, 999);
		whereClause.createdAt = { gte: start, lte: end };
	}

	if (teacherFilter) {
		whereClause.teacherService = {
			teacher: { userId: teacherFilter },
		};
	}

	const bookings = await prisma.booking.findMany({
		where: whereClause,
		include: {
			teacherService: {
				include: {
					teacher: { include: { user: true } },
					serviceType: true,
				},
			},
			student: true,
			payment: true,
			dispute: true,
			parentRefund: true,
		},
		orderBy: { createdAt: "desc" },
	});

	let totalSpent = 0;
	let totalRefunded = 0;

	for (const b of bookings) {
		const price = Number(b.price);
		if (b.paymentStatus === "PAID") {
			totalSpent += price;
		} else if (b.paymentStatus === "REFUNDED") {
			totalRefunded += price;
		}
	}

	const teachers = await prisma.user.findMany({
		where: { userType: "TEACHER" },
		select: { id: true, name: true },
	});

	const twentyFourHoursAgo = new Date();
	twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

	const formattedBookings = bookings.map((b) => {
		const isUnder24h = b.completedAt
			? b.completedAt > twentyFourHoursAgo
			: false;
		const canDispute = b.status === "COMPLETED" && isUnder24h && !b.payoutId;

		return {
			...b,
			price: Number(b.price),
			canDispute,
		};
	}) as ParentFinancialBooking[];

	return {
		bookings: formattedBookings,
		totalSpent,
		totalRefunded,
		teachers,
	};
}

export type TeacherFinancialBooking = Omit<
	Prisma.BookingGetPayload<{
		include: {
			dispute: true;
			student: true;
			teacherService: { include: { serviceType: true } };
		};
	}>,
	"price" | "appliedCommissionRate" | "trialCostToPlatform"
> & {
	price: number;
	appliedCommissionRate: number;
	trialCostToPlatform: number;
	netEarnings: number;
	isCleared: boolean;
};

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
	openDisputesCount: number;
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
		const earnings = calculateEarnings(
			Number(b.price),
			Number(b.appliedCommissionRate),
			b.isTrial,
			Number(b.trialCostToPlatform),
		);
		const net = earnings.teacherTotalEarnings;

		const isUnder24h = b.completedAt
			? b.completedAt > twentyFourHoursAgo
			: false;
		const isCleared = !isUnder24h && !b.dispute; // Basic clearance flag

		const formattedBooking = {
			...b,
			price: Number(b.price),
			appliedCommissionRate: Number(b.appliedCommissionRate),
			trialCostToPlatform: Number(b.trialCostToPlatform),
			netEarnings: net,
			isCleared,
		} as TeacherFinancialBooking;

		if (b.dispute) {
			disputedBookings.push(formattedBooking);
		} else {
			normalBookings.push(formattedBooking);
		}

		if (b.payoutId !== null) continue;

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

	const openDisputesCount = disputedBookings.filter(
		(b) => b.dispute!.status === "OPEN",
	).length;

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
		openDisputesCount,
	};
}

export type AdminPayoutsData = {
	teacherGroups: {
		teacherId: string;
		teacherName: string;
		totalNet: number;
		totalCount: number;
		bookings: {
			id: string;
			teacherId: string;
			teacherName: string;
			studentName: string;
			serviceName: string;
			startTime: Date;
			duration: number;
			price: number;
			isTrial: boolean;
			trialCostToPlatform: number;
			appliedCommissionRate: number;
			netEarnings: number;
			totalAmount: number;
			commissionAmount: number;
			trialCompensation: number;
		}[];
	}[];
	mappedPayouts: {
		id: string;
		totalAmount: number;
		commissionAmount: number;
		trialCompensation: number;
		netAmount: number;
		isPaid: boolean;
		paidAt: Date | null;
		periodStart: Date;
		periodEnd: Date;
		createdAt: Date;
		teacher: { user: { name: string } };
	}[];
	mappedRefunds: {
		id: string;
		bookingId: string;
		parentName: string;
		amount: number;
		isPaid: boolean;
		paidAt: Date | null;
		createdAt: Date;
	}[];
};

export async function getAdminPayoutsData(): Promise<AdminPayoutsData> {
	await requireAuth([UserType.ADMIN]);

	const twentyFourHoursAgo = new Date();
	twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

	const unpaidBookingsRaw = await prisma.booking.findMany({
		where: {
			status: "COMPLETED",
			payoutId: null,
			completedAt: { lte: twentyFourHoursAgo },
			OR: [{ paymentStatus: "PAID" }, { isTrial: true }],
		},
		include: {
			teacherService: {
				include: {
					teacher: {
						include: { user: { select: { name: true } } },
					},
					serviceType: { select: { name: true } },
				},
			},
			student: { select: { name: true } },
			dispute: true,
		},
		orderBy: { startTime: "asc" },
	});

	const groups: Record<string, AdminPayoutsData["teacherGroups"][0]> = {};

	const unpaidBookingsList = unpaidBookingsRaw.filter(
		(b) => !b.dispute || b.dispute.status === "RESOLVED_IN_FAVOR_OF_TEACHER",
	);

	for (const b of unpaidBookingsList) {
		const price = Number(b.price);
		const appliedCommissionRate = Number(b.appliedCommissionRate);
		const trialCostToPlatform = Number(b.trialCostToPlatform);
		const teacherId = b.teacherService.teacherId;
		const teacherName = b.teacherService.teacher.user.name || "غير معروف";

		const earnings = calculateEarnings(
			price,
			appliedCommissionRate,
			b.isTrial,
			trialCostToPlatform,
		);
		const netEarnings = earnings.teacherTotalEarnings;

		if (!groups[teacherId]) {
			groups[teacherId] = {
				teacherId,
				teacherName,
				totalNet: 0,
				totalCount: 0,
				bookings: [],
			};
		}

		groups[teacherId].bookings.push({
			id: b.id,
			teacherId,
			teacherName,
			studentName: b.student.name,
			serviceName: b.teacherService.serviceType.name,
			startTime: b.startTime,
			duration: b.duration,
			price,
			isTrial: b.isTrial,
			trialCostToPlatform,
			appliedCommissionRate,
			netEarnings,
			totalAmount: earnings.totalAmount,
			commissionAmount: earnings.commissionAmount,
			trialCompensation: earnings.trialCompensation,
		});
		groups[teacherId].totalCount++;
		groups[teacherId].totalNet += netEarnings;
	}

	const teacherGroups = Object.values(groups).sort(
		(a, b) => b.totalNet - a.totalNet,
	);

	const payouts = await prisma.teacherPayout.findMany({
		take: 50,
		include: {
			teacher: {
				select: {
					user: { select: { name: true } },
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	const mappedPayouts = payouts.map((p) => ({
		id: p.id,
		totalAmount: Number(p.totalAmount),
		commissionAmount: Number(p.commissionAmount),
		trialCompensation: Number(p.trialCompensation),
		netAmount: Number(p.netAmount),
		isPaid: p.isPaid,
		paidAt: p.paidAt,
		periodStart: p.periodStart,
		periodEnd: p.periodEnd,
		createdAt: p.createdAt,
		teacher: { user: { name: p.teacher.user.name || "غير معروف" } },
	}));

	const refunds = await prisma.parentRefund.findMany({
		take: 50,
		include: {
			booking: {
				include: { parent: { select: { name: true } } },
			},
		},
		orderBy: { createdAt: "desc" },
	});

	const mappedRefunds = refunds.map((r) => ({
		id: r.id,
		bookingId: r.bookingId,
		parentName: r.booking.parent.name || "غير معروف",
		amount: Number(r.amount),
		isPaid: r.isPaid,
		paidAt: r.paidAt,
		createdAt: r.createdAt,
	}));

	return {
		teacherGroups,
		mappedPayouts,
		mappedRefunds,
	};
}
