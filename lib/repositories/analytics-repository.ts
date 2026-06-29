import { Prisma, UserType, BookingStatus, VerificationLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bookingDetailsInclude, type DetailedBooking } from "@/lib/types";
import type { DbClient } from "./types";

export class AnalyticsRepository {
	async getTeacherDashboardOverview(teacherId: string, startDate: Date, endDate: Date) {
		const teacher = await prisma.teacher.findUnique({
			where: { id: teacherId },
			include: { user: { select: { name: true } } },
		});

		if (!teacher) return null;

		const upcomingCount = await prisma.booking.count({
			where: {
				teacherService: { teacherId },
				status: "CONFIRMED",
				startTime: { gte: new Date() },
			},
		});

		const pendingRequests = await prisma.booking.findMany({
			where: {
				teacherService: { teacherId },
				status: "PENDING",
				createdAt: { gte: startDate, lte: endDate },
			},
			include: bookingDetailsInclude,
			orderBy: { createdAt: "desc" },
		});

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

		const totalEarnings = pendingEarnings + Number(paidPayoutsSum._sum.netAmount || 0);

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
			  AND b."startTime" >= ${startDate} AND b."startTime" <= ${endDate}
			GROUP BY DATE(b."startTime")
			ORDER BY date ASC
		`;

		const chartData = chartRaw.map(r => ({
			date: new Date(r.date).toLocaleDateString("ar-EG", { weekday: "short" }),
			earnings: Number(r.earnings),
			sessions: Number(r.sessions),
		}));

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
			type: b.reportWarningLevel === 1 ? ("WARNING_1" as const) : ("WARNING_2_FROZEN" as const),
			message: b.reportWarningLevel === 1
					? "تحذير: توجد جلسة مر على انتهائها أكثر من 24 ساعة ولم تكتب التقرير. يرجى كتابته فوراً لتجنب تجميد الأرباح."
					: "تحذير أخير: أرباح جلسة سابقة أصبحت مجمدة نظراً لعدم كتابتك التقرير. الجلسة مهددة بالمصادرة إذا لم تقم بكتابة التقرير.",
		}));

		return {
			teacher,
			upcomingCount,
			pendingRequests: pendingRequests as DetailedBooking[],
			pendingEarnings,
			totalEarnings,
			chartData,
			nextSession: nextSessionRaw as DetailedBooking | null,
			liveSession: liveSession as DetailedBooking | null,
			openDisputes,
			urgentAlerts,
		};
	}

	async getAdminDashboardStats(startDate: Date, endDate: Date) {
		const pendingVerifications = await prisma.teacherVerification.count({
			where: { reviewedAt: null },
		});

		const totalBookings = await prisma.booking.count({
			where: { createdAt: { gte: startDate, lte: endDate } }
		});
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

		const completedCount = await prisma.booking.count({ 
			where: { status: "COMPLETED", createdAt: { gte: startDate, lte: endDate } } 
		});
		const completionRate = totalBookings > 0 ? ((completedCount / totalBookings) * 100).toFixed(1) : "0.0";

		const avgAgg = await prisma.booking.aggregate({
			where: { status: "COMPLETED", createdAt: { gte: startDate, lte: endDate } },
			_avg: { price: true },
		});
		const averageOrderValue = Number(avgAgg._avg.price || 0);

		const statusGroups = await prisma.booking.groupBy({
			by: ["status"],
			_count: { status: true },
			where: { createdAt: { gte: startDate, lte: endDate } }
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
			WHERE "status" = 'COMPLETED' 
			  AND "completedAt" >= ${startDate} AND "completedAt" <= ${endDate}
			GROUP BY DATE("completedAt")
			ORDER BY date ASC
		`;
		
		const revenueData = revenueRaw.map(r => ({
			date: new Date(r.date).toLocaleDateString("ar-PS", { month: "short", day: "numeric" }),
			revenue: Number(r.revenue || 0)
		}));

		const specRaw = await prisma.$queryRaw<{ name: string, count: number }[]>`
			SELECT 
				COALESCE(s.name, 'غير محدد') as name,
				COUNT(b.id)::int as count
			FROM "Booking" b
			LEFT JOIN "TeacherService" ts ON b."teacherServiceId" = ts.id
			LEFT JOIN "TeacherSubject" tsub ON ts."teacherId" = tsub."teacherId"
			LEFT JOIN "Subject" s ON tsub."subjectId" = s.id
			WHERE b."createdAt" >= ${startDate} AND b."createdAt" <= ${endDate}
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
			WHERE b."createdAt" >= ${startDate} AND b."createdAt" <= ${endDate}
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
}

export const analyticsRepository = new AnalyticsRepository();
