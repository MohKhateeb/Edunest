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

	const completedCount = await prisma.booking.count({ where: { status: "COMPLETED" } });
	const completionRate = totalBookings > 0 ? ((completedCount / totalBookings) * 100).toFixed(1) : "0.0";

	const avgAgg = await prisma.booking.aggregate({
		where: { status: "COMPLETED" },
		_avg: { price: true },
	});
	const averageOrderValue = Number(avgAgg._avg.price || 0);

	const statusGroups = await prisma.booking.groupBy({
		by: ["status"],
		_count: { status: true },
	});
	const statusMap: Record<string, string> = {
		COMPLETED: "مكتمل", CONFIRMED: "مؤكد", PENDING: "معلق", CANCELLED: "ملغي", REJECTED: "مرفوض",
	};
	const bookingStatuses = statusGroups.map(g => ({
		name: statusMap[g.status] || g.status,
		value: g._count.status,
	}));

	const revenueRaw = await prisma.$queryRaw<{ date: Date, revenue: number }[]>`
		SELECT 
			DATE("completedAt") as date,
			SUM(
				CASE 
					WHEN "isTrial" = true THEN -"trialCostToPlatform" 
					ELSE ("price" * "appliedCommissionRate" / 100) 
				END
			) as revenue
		FROM "Booking"
		WHERE "status" = 'COMPLETED' AND "completedAt" >= NOW() - INTERVAL '14 days'
		GROUP BY DATE("completedAt")
	`;
	
	const revenueData = Array.from({ length: 14 }).map((_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (13 - i));
		d.setHours(0, 0, 0, 0);
		const dateStr = d.toLocaleDateString("ar-PS", { month: "short", day: "numeric" });
		
		const nextD = new Date(d);
		nextD.setDate(d.getDate() + 1);
		
		const found = revenueRaw.find(r => {
			const rDate = new Date(r.date);
			return rDate >= d && rDate < nextD;
		});
		return { date: dateStr, revenue: Number(found?.revenue || 0) };
	});

	const specRaw = await prisma.$queryRaw<{ name: string, count: number }[]>`
		SELECT 
			COALESCE(s.name, 'غير محدد') as name,
			COUNT(b.id)::int as count
		FROM "Booking" b
		LEFT JOIN "TeacherService" ts ON b."teacherServiceId" = ts.id
		LEFT JOIN "TeacherSubject" tsub ON ts."teacherId" = tsub."teacherId"
		LEFT JOIN "Subject" s ON tsub."subjectId" = s.id
		GROUP BY COALESCE(s.name, 'غير محدد')
		ORDER BY count DESC
	`;
	const requestedSpecializations = specRaw.map(r => ({ name: r.name, count: Number(r.count) }));

	const typeRaw = await prisma.$queryRaw<{ name: string, count: number }[]>`
		SELECT 
			COALESCE(st.name, 'غير محدد') as name,
			COUNT(b.id)::int as count
		FROM "Booking" b
		LEFT JOIN "TeacherService" ts ON b."teacherServiceId" = ts.id
		LEFT JOIN "ServiceType" st ON ts."serviceTypeId" = st.id
		GROUP BY COALESCE(st.name, 'غير محدد')
		ORDER BY count DESC
	`;
	const sessionTypes = typeRaw.map(r => ({ name: r.name, count: Number(r.count) }));

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

async function _fetchTeacherBookingStats(teacherId: string) {
	const upcomingCount = await prisma.booking.count({
		where: {
			teacherService: { teacherId },
			status: "CONFIRMED",
			startTime: { gte: new Date() },
		},
	});

	const pendingRequests: DetailedBooking[] = await prisma.booking.findMany({
		where: {
			teacherService: { teacherId },
			status: "PENDING",
		},
		include: bookingDetailsInclude,
		orderBy: { createdAt: "desc" },
	});

	return { upcomingCount, pendingRequests };
}

async function _calculateTeacherRevenue(teacherId: string) {
	const pendingRaw = await prisma.$queryRaw<{ total: number }[]>`
		SELECT SUM(
			CASE 
				WHEN b."isTrial" = true THEN b."trialCostToPlatform" 
				ELSE b."price" - (b."price" * b."appliedCommissionRate" / 100) 
			END
		) as total
		FROM "Booking" b
		INNER JOIN "TeacherService" ts ON b."teacherServiceId" = ts.id
		WHERE ts."teacherId" = ${teacherId}
		  AND b."status" = 'COMPLETED'
		  AND b."payoutId" IS NULL
		  AND (b."paymentStatus" = 'PAID' OR b."isTrial" = true)
	`;
	const pendingEarnings = Number(pendingRaw[0]?.total || 0);

	const paidPayoutsSum = await prisma.teacherPayout.aggregate({
		where: { teacherId, isPaid: true },
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

	const chartRaw = await prisma.$queryRaw<{ date: Date, earnings: number, sessions: number }[]>`
		SELECT 
			DATE(b."startTime") as date,
			COUNT(b.id)::int as sessions,
			SUM(
				CASE 
					WHEN b."isTrial" = true THEN b."trialCostToPlatform" 
					ELSE b."price" - (b."price" * b."appliedCommissionRate" / 100) 
				END
			) as earnings
		FROM "Booking" b
		INNER JOIN "TeacherService" ts ON b."teacherServiceId" = ts.id
		WHERE ts."teacherId" = ${teacherId}
		  AND b."status" = 'COMPLETED'
		  AND b."startTime" >= ${last7DaysStart}
		GROUP BY DATE(b."startTime")
	`;

	const chartData = last7Days.map((date) => {
		const nextDate = new Date(date);
		nextDate.setDate(date.getDate() + 1);

		const dayData = chartRaw.find(r => {
			const rDate = new Date(r.date);
			return rDate >= date && rDate < nextDate;
		});

		return {
			date: date.toLocaleDateString("ar-EG", { weekday: "short" }),
			earnings: Number(dayData?.earnings || 0),
			sessions: Number(dayData?.sessions || 0),
		};
	});

	return { pendingEarnings, totalEarnings, chartData };
}

async function _fetchTeacherStudentStats(teacherId: string) {
	const nextSessionRaw = await prisma.booking.findFirst({
		where: {
			teacherService: { teacherId },
			status: "CONFIRMED",
			startTime: { gte: new Date() },
		},
		include: bookingDetailsInclude,
		orderBy: { startTime: "asc" },
	});

	const recentStartedSession = await prisma.booking.findFirst({
		where: {
			teacherService: { teacherId },
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
			booking: { teacherService: { teacherId } },
			status: "OPEN",
		},
		include: {
			booking: { include: { student: true } },
		},
	});

	const ghostBookings = await prisma.booking.findMany({
		where: {
			teacherService: { teacherId },
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
		nextSession: nextSessionRaw as DetailedBooking | null,
		liveSession: liveSession as DetailedBooking | null,
		openDisputes,
		urgentAlerts,
	};
}

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

	const [bookingStats, revenueStats, studentStats] = await Promise.all([
		_fetchTeacherBookingStats(teacher.id),
		_calculateTeacherRevenue(teacher.id),
		_fetchTeacherStudentStats(teacher.id),
	]);

	return {
		teacher,
		...bookingStats,
		...revenueStats,
		...studentStats,
	};
}
