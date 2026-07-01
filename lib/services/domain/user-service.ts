import { UserType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export class UserService {
	static async getUserProfile(userId: string) {
		return prisma.user.findUnique({
			where: { id: userId },
			include: { teacher: true },
		});
	}

	static async getParentStudents(parentUserId: string) {
		await requireAuth([UserType.PARENT]);
		return prisma.student.findMany({
			where: { parentUserId, isActive: true },
			include: { _count: { select: { bookings: true } } },
			orderBy: { createdAt: "desc" },
		});
	}

	static async getTeacherAvailability(userId: string) {
		await requireAuth([UserType.TEACHER]);
		const teacher = await prisma.teacher.findUnique({
			where: { userId },
		});
		if (!teacher) return null;

		const availability = await prisma.teacherAvailability.findMany({
			where: { teacherId: teacher.id },
			orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
		});

		return { teacher, availability };
	}

	static async getTeacherProfileData(userId: string) {
		await requireAuth([UserType.TEACHER]);
		const teacher = await prisma.teacher.findUnique({
			where: { userId },
			include: { user: true, subjects: { include: { subject: true } } },
		});

		const subjects = await prisma.subject.findMany({
			where: { isActive: true },
			orderBy: { name: "asc" },
		});

		const initialData = teacher
			? {
					subjectIds: teacher.subjects.map((s) => s.subjectId),
					subSpecialization: teacher.subSpecialization || null,
					bio: teacher.bio || null,
					gradeLevels: teacher.gradeLevels || [],
					city: teacher.city || null,
					area: teacher.area || null,
					education: teacher.education || null,
					yearsOfExperience: teacher.yearsOfExperience ?? 0,
					defaultHourlyRate: teacher.defaultHourlyRate
						? Number(teacher.defaultHourlyRate)
						: 50,
					profileImageUrl: teacher.profileImageUrl || null,
				}
			: null;

		return { teacher, subjects, initialData };
	}

	static async getTeacherServicesData(userId: string) {
		await requireAuth([UserType.TEACHER]);
		const teacher = await prisma.teacher.findUnique({
			where: { userId },
		});
		if (!teacher) return null;

		const configuredServices = await prisma.teacherService.findMany({
			where: { teacherId: teacher.id },
			include: { serviceType: true },
			orderBy: { serviceType: { name: "asc" } },
		});

		const serviceTypes = await prisma.serviceType.findMany({
			where: { isActive: true },
			orderBy: { displayOrder: "asc" },
		});

		const mappedServices = configuredServices.map((cs) => ({
			id: cs.id,
			price: Number(cs.price),
			duration: cs.duration,
			customDescription: cs.customDescription,
			serviceType: cs.serviceType,
		}));

		return { teacher, configuredServices, serviceTypes, mappedServices };
	}

	static async getTeacherVerificationData(userId: string) {
		await requireAuth([UserType.TEACHER]);
		const teacher = await prisma.teacher.findUnique({
			where: { userId },
			include: { verification: true },
		});
		return teacher;
	}

	static async getTeacherPublicProfile(slug: string) {
		return prisma.teacher.findUnique({
			where: { slug },
			include: {
				user: { select: { name: true, email: true, isActive: true } },
				subjects: { include: { subject: true } },
				services: {
					where: { isActive: true, serviceType: { isActive: true } },
					include: {
						serviceType: { select: { name: true, defaultDuration: true } },
					},
					orderBy: { price: "asc" },
				},
				availability: {
					where: { isActive: true },
					orderBy: { dayOfWeek: "asc" },
				},
				reviews: {
					where: { isVisible: true },
					orderBy: { createdAt: "desc" },
					take: 10,
					include: {
						booking: {
							select: {
								parent: { select: { name: true } },
								student: { select: { name: true, grade: true } },
							},
						},
					},
				},
			},
		});
	}

	static async searchTeachers(params: {
		subject?: string;
		city?: string;
		page?: string;
	}) {
		const page = Math.max(1, parseInt(params.page ?? "1", 10));
		const PAGE_SIZE = 12;

		const where: Prisma.TeacherWhereInput = {
			isVerified: true,
			user: { isActive: true },
		};
		if (params.subject)
			where.subjects = {
				some: {
					subject: { name: { contains: params.subject, mode: "insensitive" } },
				},
			};
		if (params.city)
			where.city = { contains: params.city, mode: "insensitive" };

		const [teachers, total] = await Promise.all([
			prisma.teacher.findMany({
				where,
				select: {
					id: true,
					slug: true,
					subjects: { include: { subject: true } },
					subSpecialization: true,
					city: true,
					area: true,
					averageRating: true,
					totalReviews: true,
					totalSessions: true,
					profileImageUrl: true,
					verificationLevel: true,
					yearsOfExperience: true,
					gradeLevels: true,
					user: { select: { name: true } },
					services: {
						where: {
							isActive: true,
							serviceType: { isActive: true },
						},
						select: { price: true },
						orderBy: { price: "asc" },
						take: 1,
					},
				},
				orderBy: [{ averageRating: "desc" }, { totalSessions: "desc" }],
				skip: (page - 1) * PAGE_SIZE,
				take: PAGE_SIZE,
			}),
			prisma.teacher.count({ where }),
		]);

		return { teachers, total, page, PAGE_SIZE };
	}

	static async getTeacherMetadata(slug: string) {
		return prisma.teacher.findUnique({
			where: { slug },
			select: {
				subjects: { include: { subject: true } },
				bio: true,
				city: true,
				user: { select: { name: true, isActive: true } },
			},
		});
	}
}
