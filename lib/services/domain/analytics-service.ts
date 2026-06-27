import { type Prisma, UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { bookingDetailsInclude, type DetailedBooking } from "@/lib/types";
import {
	computeBookingStatuses,
	computeFinancialKPIs,
	computeRequestedSpecializations,
	computeRevenueTrends,
	computeSessionTypes,
} from "@/lib/utils/admin-analytics";
import { calculateEarnings } from "@/lib/utils/financial";

export type AdminDashboardOverview = {
	pendingVerifications: number;
	totalBookings: number;
	totalStudents: number;
	activeTeachers: number;
	averageOrderValue: number;
	completionRate: string;
	bookingStatuses: { name: string; value: number }[];
	revenueData: { date: string; revenue: number }[];
	requestedSpecializations: { name: string; count: number }[];
	sessionTypes: { name: string; count: number }[];
	registeredGrades: { name: string; count: number }[];
	openDisputesCount: number;
	pendingPayoutsCount: number;
	pendingEscrowsCount: number;
};

export async function getAdminDashboardOverview(): Promise<AdminDashboardOverview> {
	await requireAuth([UserType.ADMIN]);

	const pendingVerifications = await prisma.teacherVerification.count({
		where: { reviewedAt: null },
	});

	const totalBookings = await prisma.booking.count();
	const totalStudents = await prisma.student.count();
	const activeTeachers = await prisma.teacher.count({
		where: { isVerified: true },
	});

	const openDisputesCount = await prisma.dispute.count({
		where: { status: "OPEN" },
	});

	const pendingPayoutsCount = await prisma.teacherPayout.count({
		where: { isPaid: false },
	});

	const pendingEscrowsCount = await prisma.adminEscrow.count({
		where: { status: "PENDING" },
	});

	const allBookings = await prisma.booking.findMany({
		take: 500,
		orderBy: { createdAt: "desc" },
		select: {
			status: true,
			price: true,
			appliedCommissionRate: true,
			isTrial: true,
			trialCostToPlatform: true,
			completedAt: true,
			teacherService: {
				select: {
					serviceType: { select: { name: true } },
					teacher: { select: { subjects: { include: { subject: true } } } },
				},
			},
		},
	});

	const completedBookings = allBookings.filter((b) => b.status === "COMPLETED");
	const { averageOrderValue, completionRate } = computeFinancialKPIs(
		completedBookings,
		totalBookings,
	);

	const bookingStatuses = computeBookingStatuses(allBookings);
	const revenueData = computeRevenueTrends(completedBookings);
	const requestedSpecializations = computeRequestedSpecializations(allBookings);
	const sessionTypes = computeSessionTypes(allBookings);

	const gradeGroups = await prisma.student.groupBy({
		by: ["grade"],
		_count: { grade: true },
	});

	const registeredGrades = gradeGroups
		.map((g) => ({
			name: `الصف ${g.grade}`,
			count: g._count.grade,
			grade: g.grade,
		}))
		.sort((a, b) => a.grade - b.grade)
		.map(({ grade, ...rest }) => rest);

	return {
		pendingVerifications,
		totalBookings,
		totalStudents,
		activeTeachers,
		averageOrderValue,
		completionRate,
		bookingStatuses,
		revenueData,
		requestedSpecializations,
		sessionTypes,
		registeredGrades,
		openDisputesCount,
		pendingPayoutsCount,
		pendingEscrowsCount,
	};
}

export type TeacherDashboardOverview = {
	teacher: Prisma.TeacherGetPayload<{
		include: { user: { select: { name: true } } };
	}>;
	upcomingCount: number;
	pendingRequests: DetailedBooking[];
	pendingEarnings: number;
	totalEarnings: number;
	chartData: { date: string; earnings: number; sessions: number }[];
	nextSession: DetailedBooking | null;
	liveSession: DetailedBooking | null;
	openDisputes: Prisma.DisputeGetPayload<{
		include: { booking: { include: { student: true } } };
	}>[];
	urgentAlerts: {
		id: string;
		type: "WARNING_1" | "WARNING_2_FROZEN";
		message: string;
		bookingId: string;
	}[];
};

export async function getTeacherDashboardOverview(
	userId: string,
): Promise<TeacherDashboardOverview | null> {
	await requireAuth([UserType.TEACHER]);

	const teacher = await prisma.teacher.findUnique({
		where: { userId },
		include: {
			user: { select: { name: true } },
		},
	});

	if (!teacher) {
		return null;
	}

	const upcomingCount = await prisma.booking.count({
		where: {
			teacherService: { teacherId: teacher.id },
			status: "CONFIRMED",
			startTime: { gte: new Date() },
		},
	});

	const pendingRequests: DetailedBooking[] = await prisma.booking.findMany({
		where: {
			teacherService: { teacherId: teacher.id },
			status: "PENDING",
		},
		include: bookingDetailsInclude,
		orderBy: { createdAt: "desc" },
	});

	const completedUnpaidBookings = await prisma.booking.findMany({
		take: 500,
		orderBy: { completedAt: "desc" },
		where: {
			teacherService: { teacherId: teacher.id },
			status: "COMPLETED",
			payoutId: null,
			OR: [{ paymentStatus: "PAID" }, { isTrial: true }],
		},
	});

	let pendingEarnings = 0;
	for (const b of completedUnpaidBookings) {
		const earnings = calculateEarnings(
			Number(b.price),
			Number(b.appliedCommissionRate),
			b.isTrial,
			Number(b.trialCostToPlatform),
		);
		pendingEarnings += earnings.teacherTotalEarnings;
	}

	const paidPayoutsSum = await prisma.teacherPayout.aggregate({
		where: { teacherId: teacher.id, isPaid: true },
		_sum: { netAmount: true },
	});

	const totalEarnings =
		pendingEarnings + Number(paidPayoutsSum._sum.netAmount || 0);

	const last7Days = Array.from({ length: 7 }).map((_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (6 - i));
		d.setHours(0, 0, 0, 0);
		return d;
	});

	const last7DaysStart = last7Days[0];

	const recentCompletedBookings = await prisma.booking.findMany({
		where: {
			teacherService: { teacherId: teacher.id },
			status: "COMPLETED",
			startTime: { gte: last7DaysStart },
		},
	});

	const chartData = last7Days.map((date) => {
		const nextDate = new Date(date);
		nextDate.setDate(date.getDate() + 1);

		const dayBookings = recentCompletedBookings.filter(
			(b) => b.startTime >= date && b.startTime < nextDate,
		);

		let earnings = 0;
		for (const b of dayBookings) {
			if (b.isTrial) {
				earnings += Number(b.trialCostToPlatform);
			} else {
				const price = Number(b.price);
				const commRate = Number(b.appliedCommissionRate);
				earnings += price - (price * commRate) / 100;
			}
		}

		return {
			date: date.toLocaleDateString("ar-EG", { weekday: "short" }),
			earnings: earnings,
			sessions: dayBookings.length,
		};
	});

	const nextSessionRaw = await prisma.booking.findFirst({
		where: {
			teacherService: { teacherId: teacher.id },
			status: "CONFIRMED",
			startTime: { gte: new Date() },
		},
		include: bookingDetailsInclude,
		orderBy: { startTime: "asc" },
	});

	const recentStartedSession = await prisma.booking.findFirst({
		where: {
			teacherService: { teacherId: teacher.id },
			status: "CONFIRMED",
			startTime: { lte: new Date() },
		},
		include: bookingDetailsInclude,
		orderBy: { startTime: "desc" },
	});

	let liveSession = null;
	if (recentStartedSession) {
		const startMs = recentStartedSession.startTime.getTime();
		const durationMs = recentStartedSession.duration * 60000;
		const graceMs = 30 * 60000;
		if (Date.now() <= startMs + durationMs + graceMs) {
			liveSession = recentStartedSession;
		}
	}

	const openDisputes = await prisma.dispute.findMany({
		where: {
			booking: { teacherService: { teacherId: teacher.id } },
			status: "OPEN",
		},
		include: {
			booking: { include: { student: true } },
		},
	});

	const ghostBookings = await prisma.booking.findMany({
		where: {
			teacherService: { teacherId: teacher.id },
			status: "CONFIRMED",
			reportWarningLevel: { in: [1, 2] },
		},
		select: { id: true, reportWarningLevel: true },
	});

	const urgentAlerts = ghostBookings.map((b) => ({
		id: `alert-${b.id}`,
		bookingId: b.id,
		type:
			b.reportWarningLevel === 1 ? ("WARNING_1" as const) : ("WARNING_2_FROZEN" as const),
		message:
			b.reportWarningLevel === 1
				? "تحذير: توجد جلسة مر على انتهائها أكثر من 24 ساعة ولم تكتب التقرير. يرجى كتابته فوراً لتجنب تجميد الأرباح."
				: "تحذير أخير: أرباح جلسة سابقة أصبحت مجمدة نظراً لعدم كتابتك التقرير. الجلسة مهددة بالمصادرة إذا لم تقم بكتابة التقرير.",
	}));

	return {
		teacher,
		upcomingCount,
		pendingRequests,
		pendingEarnings,
		totalEarnings,
		chartData,
		nextSession: nextSessionRaw as DetailedBooking | null,
		liveSession: liveSession as DetailedBooking | null,
		openDisputes,
		urgentAlerts,
	};
}
