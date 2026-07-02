import type { Notification } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DetailedBooking } from "@/lib/types";
import { bookingDetailsInclude } from "@/lib/types";
import { sanitizePrismaData } from "@/lib/utils";

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
): Promise<DashboardInsights> {
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
			message = `بانتظار الدفع: جلسة ${b.teacherService.serviceType.name} للطالب ${b.student.name}`;
			dueDate = new Date(b.startTime.getTime() - 2 * 60 * 60 * 1000); // just an example due date
		} else if (b.status === "PENDING_APPROVAL") {
			type = "APPROVAL";
			message = `بانتظار الموافقة: جلسة ${b.teacherService.serviceType.name} للطالب ${b.student.name}`;
		} else if (b.status === "COMPLETED" && !b.review) {
			type = "REVIEW";
			message = `الرجاء التقييم: جلسة ${b.teacherService.serviceType.name} للطالب ${b.student.name}`;
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
			hakeemMessage = `تشير التقارير إلى ملاحظة من معلم ${subjectName} بشأن ${studentName}: "${report.teacherNotes}". أنصحك بمتابعة هذه النقطة لضمان استمرار التحسن.`;
		} else if (
			report.homeworkAssigned &&
			report.homeworkAssigned.trim() !== "" &&
			report.homeworkAssigned.toLowerCase() !== "no"
		) {
			hakeemMessage = `أظهرت التقارير وجود واجب مدرسي في ${subjectName} مطلوب من ${studentName}: "${report.homeworkAssigned}". متابعة حله ستساهم في ترسيخ المعلومات بشكل كبير.`;
		} else if (report.studentPerformance && report.studentPerformance < 3) {
			hakeemMessage = `لاحظت تراجعاً طفيفاً في أداء ${studentName} في الجلسة الأخيرة لمادة ${subjectName}. قد يكون من المفيد حجز جلسة إضافية للتركيز على المفاهيم غير الواضحة.`;
		} else {
			hakeemMessage = `أداء ممتاز من ${studentName} في ${subjectName}! المراجعة المنتظمة هي مفتاح التفوق، استمروا على هذا النهج.`;
		}
	} else if (students.length > 0) {
		hakeemMessage = `أهلاً بك يا ${userName}. بناءً على البيانات، لم يتم تسجيل أي جلسات مكتملة بعد. البدء مبكراً خطوة حكيمة لتقييم المستوى الدراسي وتحديد الأهداف.`;
	} else {
		hakeemMessage = `يسعدنا انضمامك للمنصة. الخطوة الأولى والأساسية هي إضافة أبنائك وتحديث بياناتهم حتى أتمكن من تقديم تحليلات دقيقة لأدائهم لاحقاً.`;
	}

	// --- صياغة رسالة نجيب التشجيعية (Najeeb's Encouragement) ---
	let najeebMessage = "";
	let najeebMode: "welcome" | "study" | "success" | "help";

	if (upcomingBookingsCount > 0) {
		najeebMessage = `يا سلام! لدينا ${upcomingBookingsCount} جلسة قادمة! 🚀 أنا متحمس جداً لبدء التعلم، تأكد من تجهيز الدفاتر والأقلام!`;
		najeebMode = "study";
	} else if (students.length > 0 && upcomingBookingsCount === 0) {
		najeebMessage = `لا توجد جلسات مجدولة حالياً. ما رأيك أن نحجز جلسة جديدة لنستمر في رحلتنا التعليمية الممتعة؟ 💡`;
		najeebMode = "help";
	} else {
		najeebMessage = `مرحباً بك! أنا نجيب، سأكون رفيقكم في هذه الرحلة الرائعة. هل أنت مستعد للبدء؟ ✨`;
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
