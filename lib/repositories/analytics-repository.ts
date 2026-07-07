import { BOOKING_STATUS_AR } from "@/lib/translations";
import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";
import { getTranslations } from "next-intl/server";
import { Prisma, UserType, BookingStatus, VerificationLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bookingDetailsInclude, type DetailedBooking } from "@/lib/types";
import type { DbClient } from "./types";

export class AnalyticsRepository {
	async getTeacherDashboardOverview(teacherId: string, startDate: Date, endDate: Date, locale: string = "ar") {
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
				status: { in: ["PENDING", "PENDING_APPROVAL", "AWAITING_PAYMENT"] },
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
			FROM "bookings" b
			INNER JOIN "teacher_services" ts ON b."teacherServiceId" = ts.id
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
			FROM "bookings" b
			INNER JOIN "teacher_services" ts ON b."teacherServiceId" = ts.id
			WHERE ts."teacherId" = ${teacherId}
			  AND b."status" = 'COMPLETED'
			  AND b."startTime" >= ${startDate} AND b."startTime" <= ${endDate}
			GROUP BY DATE(b."startTime")
			ORDER BY date ASC
		`;

		const chartData = chartRaw.map(r => ({
			date: new Date(r.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "short" }),
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

		const tNotif = await getNotificationT();
		const urgentAlerts = ghostBookings.map((b) => ({
			id: `alert-${b.id}`,
			bookingId: b.id,
			type: b.reportWarningLevel === 1 ? ("WARNING_1" as const) : ("WARNING_2_FROZEN" as const),
			message: b.reportWarningLevel === 1 ? tNotif("booking_report_warning_message") : tNotif("booking_report_warning_final_message"),
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

	async getAdminDashboardStats(startDate: Date, endDate: Date, locale: string = "ar") {
		const pendingVerifications = await prisma.teacherVerification.count({
			where: { reviewedAt: null },
		});

		const tCommon = await getTranslations("common");
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
		const statusMap: Record<string, string> = BOOKING_STATUS_AR;
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
			FROM "bookings"
			WHERE "status" = 'COMPLETED' 
			  AND "completedAt" >= ${startDate} AND "completedAt" <= ${endDate}
			GROUP BY DATE("completedAt")
			ORDER BY date ASC
		`;
		
		const revenueData = revenueRaw.map(r => ({
			date: new Date(r.date).toLocaleDateString(locale === "ar" ? "ar-PS" : "en-US", { month: "short", day: "numeric" }),
			revenue: Number(r.revenue || 0)
		}));

		const specRaw = await prisma.$queryRaw<{ name: string, count: number }[]>`
			SELECT 
				COALESCE(s.name, 'UNSPECIFIED') as name,
				COUNT(b.id)::int as count
			FROM "bookings" b
			LEFT JOIN "teacher_services" ts ON b."teacherServiceId" = ts.id
			LEFT JOIN "teacher_subjects" tsub ON ts."teacherId" = tsub."teacherId"
			LEFT JOIN "subjects" s ON tsub."subjectId" = s.id
			WHERE b."createdAt" >= ${startDate} AND b."createdAt" <= ${endDate}
			GROUP BY COALESCE(s.name, 'UNSPECIFIED')
			ORDER BY count DESC
		`;
		const requestedSpecializations = specRaw.map(r => ({ 
			name: r.name === 'UNSPECIFIED' ? tCommon("unspecified") : r.name, 
			count: Number(r.count) 
		}));

		const typeRaw = await prisma.$queryRaw<{ name: string, count: number }[]>`
			SELECT 
				COALESCE(st.name, 'UNSPECIFIED') as name,
				COUNT(b.id)::int as count
			FROM "bookings" b
			LEFT JOIN "teacher_services" ts ON b."teacherServiceId" = ts.id
			LEFT JOIN "service_types" st ON ts."serviceTypeId" = st.id
			WHERE b."createdAt" >= ${startDate} AND b."createdAt" <= ${endDate}
			GROUP BY COALESCE(st.name, 'UNSPECIFIED')
			ORDER BY count DESC
		`;
		const sessionTypes = typeRaw.map(r => ({ 
			name: r.name === 'UNSPECIFIED' ? tCommon("unspecified") : r.name, 
			count: Number(r.count) 
		}));

		const gradeGroups = await prisma.student.groupBy({
			by: ["grade"],
			_count: { grade: true },
		});

		const registeredGrades = gradeGroups
			.map((g) => ({
				name: tCommon("grade_level", { grade: g.grade }),
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
