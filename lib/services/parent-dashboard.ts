import type { Notification } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DetailedBooking } from "@/lib/types";
import { bookingDetailsInclude } from "@/lib/types";
import { sanitizePrismaData } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export type DashboardInsights = {
	hakeemMessage: string;
	najeebMessage: string;
	najeebMode: "welcome" | "study" | "success" | "help";
	stats: {
		studentCount: number;
		upcomingBookingsCount: number;
	};
	nextSession: DetailedBooking | null;
	urgentActions: {
		type: "PAYMENT" | "APPROVAL" | "REVIEW";
		booking: DetailedBooking;
		message: string;
		dueDate?: Date;
	}[];
	todaySessions: DetailedBooking[];
	notifications: Notification[];
};

export async function getParentDashboardInsights(
	userId: string,
	userName: string,
	locale: string = "ar"
): Promise<DashboardInsights> {
	const t = await getTranslations({ locale, namespace: "parent" });

	const studentCount = await prisma.student.count({
		where: { parentUserId: userId, isActive: true },
	});

	const upcomingBookingsCount = await prisma.booking.count({
		where: {
			parentUserId: userId,
			status: { in: ["PENDING", "PENDING_APPROVAL", "AWAITING_PAYMENT", "CONFIRMED"] },
			startTime: { gte: new Date() },
		},
	});

	const notifications = await prisma.notification.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		take: 5,
	});

	const nextSession = await prisma.booking.findFirst({
		where: {
			parentUserId: userId,
			status: "CONFIRMED",
			startTime: { gte: new Date() },
		},
		include: bookingDetailsInclude,
		orderBy: { startTime: "asc" },
	});

	const sanitizedNextSession = nextSession
		? sanitizePrismaData(nextSession)
		: null;

	const urgentBookings = await prisma.booking.findMany({
		where: {
			parentUserId: userId,
			OR: [
				{ status: "AWAITING_PAYMENT" },
				{ status: "PENDING_APPROVAL" },
				{ status: "COMPLETED", review: { is: null } },
			],
		},
		include: bookingDetailsInclude,
		orderBy: { startTime: "asc" },
	});

	const urgentActions = urgentBookings.map((b) => {
		let type: "PAYMENT" | "APPROVAL" | "REVIEW" = "PAYMENT";
		let message = "";
		let dueDate: Date | undefined;

		if (b.status === "AWAITING_PAYMENT") {
			type = "PAYMENT";
			message = t("awaiting_payment_booking", { service: b.teacherService.serviceType.name, student: b.student.name });
			dueDate = new Date(b.startTime.getTime() - 2 * 60 * 60 * 1000); // just an example due date
		} else if (b.status === "PENDING_APPROVAL") {
			type = "APPROVAL";
			message = t("pending_approval_booking", { service: b.teacherService.serviceType.name, student: b.student.name });
		} else if (b.status === "COMPLETED" && !b.review) {
			type = "REVIEW";
			message = t("pending_review_booking", { service: b.teacherService.serviceType.name, student: b.student.name });
		}

		return {
			type,
			booking: sanitizePrismaData(b),
			message,
			dueDate,
		};
	});

	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);
	const endOfToday = new Date();
	endOfToday.setHours(23, 59, 59, 999);

	const todayBookingsRaw = await prisma.booking.findMany({
		where: {
			parentUserId: userId,
			startTime: { gte: startOfToday, lte: endOfToday },
			status: { in: ["CONFIRMED", "COMPLETED", "AWAITING_PAYMENT"] },
		},
		include: bookingDetailsInclude,
		orderBy: { startTime: "asc" },
	});

	const todaySessions = todayBookingsRaw.map(sanitizePrismaData);

	const students = await prisma.student.findMany({
		where: { parentUserId: userId, isActive: true },
		select: { id: true, name: true },
	});
	const studentIds = students.map((s) => s.id);

	const completedBookings = await prisma.booking.findMany({
		where: {
			studentId: { in: studentIds },
			status: "COMPLETED",
		},
		include: {
			student: true,
			report: true,
			teacherService: {
				include: {
					serviceType: true,
					teacher: {
						include: { user: { select: { name: true } } },
					},
				},
			},
		},
		orderBy: { startTime: "desc" },
	});

	// Removed stats calculation logic as requested

	// --- صياغة نصيحة الحكيم المبنية على بيانات دقيقة (Hakeem's Data-Driven Advice) ---
	let hakeemMessage = "";
	const latestBooking = completedBookings[0];

	if (latestBooking && latestBooking.report) {
		const report = latestBooking.report;
		const studentName = latestBooking.student.name;
		const subjectName = latestBooking.teacherService.serviceType.name;

		if (report.teacherNotes && report.teacherNotes.trim() !== "") {
			hakeemMessage = t("hakeem_notes_advice", { subjectName, studentName, notes: report.teacherNotes });
		} else if (
			report.homeworkAssigned &&
			report.homeworkAssigned.trim() !== "" &&
			report.homeworkAssigned.toLowerCase() !== "no"
		) {
			hakeemMessage = t("hakeem_homework_advice", { subjectName, studentName, homework: report.homeworkAssigned });
		} else if (report.studentPerformance && report.studentPerformance < 3) {
			hakeemMessage = t("hakeem_performance_advice", { studentName, subjectName });
		} else {
			hakeemMessage = t("hakeem_excellent_advice", { studentName, subjectName });
		}
	} else if (students.length > 0) {
		hakeemMessage = t("hakeem_no_sessions_advice", { userName });
	} else {
		hakeemMessage = t("hakeem_welcome_advice");
	}

	// --- صياغة رسالة نجيب التشجيعية (Najeeb's Encouragement) ---
	let najeebMessage = "";
	let najeebMode: "welcome" | "study" | "success" | "help";

	if (upcomingBookingsCount > 0) {
		najeebMessage = t("najeeb_upcoming_sessions", { count: upcomingBookingsCount });
		najeebMode = "study";
	} else if (students.length > 0 && upcomingBookingsCount === 0) {
		najeebMessage = t("najeeb_no_sessions");
		najeebMode = "help";
	} else {
		najeebMessage = t("najeeb_welcome");
		najeebMode = "welcome";
	}

	return {
		hakeemMessage,
		najeebMessage,
		najeebMode,
		stats: {
			studentCount,
			upcomingBookingsCount,
		},
		nextSession: sanitizedNextSession,
		urgentActions,
		todaySessions,
		notifications,
	};
}
