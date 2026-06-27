import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { UserType } from "@prisma/client";

export class SessionService {
	static async getParentLiveRadarData(parentId: string) {
		await requireAuth([UserType.PARENT]);

		const students = await prisma.student.findMany({
			where: { parentUserId: parentId, isActive: true },
			select: { id: true, name: true, grade: true },
		});

		const rawServiceTypes = await prisma.serviceType.findMany({
			where: { isActive: true, isRecurring: false },
			select: { id: true, name: true, fazaaPrice: true, fazaaDuration: true },
		});

		const serviceTypes = rawServiceTypes.map((st) => ({
			...st,
			fazaaPrice: st.fazaaPrice ? Number(st.fazaaPrice) : 50,
			fazaaDuration: st.fazaaDuration || 30,
		}));

		const subjects = await prisma.subject.findMany({
			where: { isActive: true },
			select: { id: true, name: true },
			orderBy: { name: "asc" },
		});

		return { students, serviceTypes, subjects };
	}

	static async getTeacherLiveRadarData(userId: string) {
		await requireAuth([UserType.TEACHER]);

		const teacher = await prisma.teacher.findUnique({
			where: { userId },
			select: {
				id: true,
				subjects: { select: { subjectId: true } },
				gradeLevels: true,
				isAvailableNow: true,
			},
		});

		if (!teacher) {
			throw new Error("Teacher not found");
		}

		const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

		const rawRequests = await prisma.tutoringRequest.findMany({
			where: {
				status: "PENDING",
				createdAt: { gte: fifteenMinutesAgo },
				subjectId: { in: teacher.subjects.map((s) => s.subjectId) },
				student: {
					grade: { in: teacher.gradeLevels },
				},
			},
			include: {
				student: { select: { name: true, grade: true } },
				subject: { select: { name: true } },
			},
			orderBy: { createdAt: "desc" },
		});

		const liveRequests = rawRequests.map((req) => ({
			id: req.id,
			title: req.title,
			specialization: req.subject?.name || "غير محدد",
			price: Number(req.price || 50),
			duration: req.duration || 30,
			createdAt: req.createdAt,
			student: {
				name: req.student.name,
				grade: req.student.grade,
			},
		}));

		return { teacher, liveRequests };
	}

	static async getSessionMeetData(bookingId: string) {
		return prisma.booking.findUnique({
			where: { id: bookingId },
			include: {
				student: true,
				teacherService: {
					include: {
						teacher: {
							include: {
								user: { select: { id: true, name: true } },
							},
						},
						serviceType: true,
					},
				},
			},
		});
	}

	static async getSessionDetailsData(bookingId: string) {
		return prisma.booking.findUnique({
			where: { id: bookingId },
			include: {
				student: true,
				teacherService: {
					include: {
						teacher: {
							include: {
								user: { select: { id: true, name: true, email: true } },
							},
						},
						serviceType: true,
					},
				},
				dispute: true,
			},
		});
	}
}
