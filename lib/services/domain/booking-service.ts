import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { bookingDetailsInclude, type DetailedBooking } from "@/lib/types";
import { getDetailedSessionState } from "@/lib/utils/booking-state";
import { UserType } from "@prisma/client";

export class BookingService {
	static async getParentBookings(parentId: string) {
		await requireAuth([UserType.PARENT]);
		const bookings = await prisma.booking.findMany({
			where: { parentUserId: parentId },
			include: bookingDetailsInclude,
			orderBy: { startTime: "asc" },
		});

		let upcomingCount = 0;
		let pendingCount = 0;
		let reportsCount = 0;
		let ghostCount = 0;

		for (const b of bookings) {
			if (b.status === "CONFIRMED") upcomingCount++;
			if (b.status === "PENDING") pendingCount++;
			if (b.status === "COMPLETED" && b.report) reportsCount++;
			if (b.status === "CONFIRMED") {
				const state = getDetailedSessionState(b.startTime, b.duration);
				if (state.status === "ghost") ghostCount++;
			}
		}

		const hakeemMsg =
			upcomingCount > 0
				? `ممتاز، لديك ${upcomingCount} جلسة قادمة مؤكدة. المتابعة المستمرة لجدول الجلسات وحضورها في الوقت المحدد هو مفتاح التفوق والتميز لأبنائك.`
				: "ليس لديك أي جلسات قادمة مؤكدة حالياً. متابعة التقارير للجلسات السابقة يساعدك في تحديد ما يحتاجه أبناؤك في الجلسات القادمة.";

		return {
			bookings,
			insights: {
				hakeemMsg,
				upcomingCount,
				pendingCount,
				reportsCount,
				ghostCount,
			},
		};
	}

	static async getTeacherBookings(userId: string): Promise<DetailedBooking[]> {
		await requireAuth([UserType.TEACHER]);
		const teacher = await prisma.teacher.findUnique({
			where: { userId },
		});
		if (!teacher) throw new Error("Teacher not found");

		return prisma.booking.findMany({
			where: { teacherService: { teacherId: teacher.id } },
			include: bookingDetailsInclude,
			orderBy: { startTime: "desc" },
		});
	}

	static async getAdminBookings(): Promise<DetailedBooking[]> {
		await requireAuth([UserType.ADMIN]);
		return prisma.booking.findMany({
			take: 200,
			orderBy: { createdAt: "desc" },
			include: bookingDetailsInclude,
		});
	}

	static async getBookByTeacherData(userId: string) {
		await requireAuth([UserType.PARENT]);
		
		const students = await prisma.student.findMany({
			where: { parentUserId: userId, isActive: true },
			select: { id: true, name: true, grade: true },
			orderBy: { name: "asc" },
		});

		const parentUser = await prisma.user.findUnique({
			where: { id: userId },
			select: { hasUsedFreeTrial: true },
		});

		const teachers = await prisma.teacher.findMany({
			where: {
				isVerified: true,
				user: { isActive: true },
			},
			select: {
				id: true,
				userId: true,
				slug: true,
				profileImageUrl: true,
				user: { select: { name: true } },
				services: {
					where: { isActive: true, serviceType: { isActive: true } },
					select: {
						id: true,
						price: true,
						duration: true,
						serviceType: {
							select: {
								id: true,
								name: true,
								nameEnglish: true,
								defaultDuration: true,
							},
						},
					},
				},
				availability: {
					where: { isActive: true },
					select: { dayOfWeek: true, startTime: true, endTime: true },
				},
				reviews: { select: { rating: true } },
			},
			orderBy: { user: { name: "asc" } },
		});

		const fourteenDaysFromNow = new Date();
		fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
		const teacherIds = teachers.map((t) => t.id);

		const bookings = await prisma.booking.findMany({
			where: {
				status: { in: ["PENDING", "CONFIRMED"] },
				startTime: { gte: new Date(), lte: fourteenDaysFromNow },
				teacherService: { teacherId: { in: teacherIds } },
			},
			select: {
				startTime: true,
				duration: true,
				teacherService: { select: { teacherId: true } },
			},
		});

		const teachersWithBookings = teachers.map((t) => {
			const tutorBookings = bookings
				.filter((b) => b.teacherService.teacherId === t.id)
				.map((b) => ({
					startTime: b.startTime,
					duration: b.duration,
				}));

			return {
				id: t.id,
				userId: t.userId,
				slug: t.slug,
				profileImageUrl: t.profileImageUrl,
				user: { name: t.user.name },
				services: t.services.map((s) => ({
					id: s.id,
					price: Number(s.price),
					duration: s.duration,
					serviceType: s.serviceType,
				})),
				availability: t.availability,
				bookings: tutorBookings,
			};
		});

		return { students, parentUser, teachersWithBookings };
	}

	static async getBookByTimeData(userId: string) {
		await requireAuth([UserType.PARENT]);
		
		const students = await prisma.student.findMany({
			where: { parentUserId: userId, isActive: true },
			select: { id: true, name: true, grade: true },
			orderBy: { name: "asc" },
		});

		const parentUser = await prisma.user.findUnique({
			where: { id: userId },
			select: { hasUsedFreeTrial: true },
		});

		const subjects = await prisma.subject.findMany({
			where: { isActive: true },
			orderBy: { name: "asc" },
		});

		return { students, parentUser, subjects };
	}

	static async getTeacherBookingDetails(bookingId: string, userId: string) {
		await requireAuth([UserType.TEACHER]);

		const teacher = await prisma.teacher.findUnique({
			where: { userId },
		});

		if (!teacher) return null;

		return prisma.booking.findUnique({
			where: {
				id: bookingId,
				teacherService: { teacherId: teacher.id },
			},
			include: {
				student: { include: { parent: true } },
				teacherService: { include: { serviceType: true } },
				dispute: true,
				payout: true,
			},
		});
	}
}
