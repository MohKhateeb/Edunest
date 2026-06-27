import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { UserType } from "@prisma/client";

export class SystemAdminService {
	static async getAdminDisputes() {
		await requireAuth([UserType.ADMIN]);
		return prisma.dispute.findMany({
			include: {
				booking: {
					include: {
						student: { select: { name: true } },
						teacherService: {
							include: { teacher: { include: { user: { select: { name: true } } } } },
						},
						parent: { select: { name: true } },
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}

	static async getAdminServices() {
		await requireAuth([UserType.ADMIN]);
		const serviceTypes = await prisma.serviceType.findMany({
			orderBy: { displayOrder: "asc" },
		});
		return serviceTypes.map((st) => ({
			...st,
			commissionRate: Number(st.commissionRate),
			fazaaPrice: st.fazaaPrice ? Number(st.fazaaPrice) : null,
		}));
	}

	static async getHomepageSettings() {
		await requireAuth([UserType.ADMIN]);
		return prisma.systemSetting.findUnique({
			where: { settingKey: "HomepageLayout" },
		});
	}

	static async getSystemSettings() {
		await requireAuth([UserType.ADMIN]);
		const settings = await prisma.systemSetting.findMany({
			orderBy: { settingKey: "asc" },
		});

		const groupedSettings: Record<string, typeof settings> = {
			FINANCIAL: [],
			TRIAL: [],
			POLICY: [],
			OTHER: [],
		};

		for (const setting of settings) {
			if (
				setting.settingKey.includes("Commission") ||
				setting.settingKey.includes("Price")
			) {
				groupedSettings.FINANCIAL.push(setting);
			} else if (setting.settingKey.includes("Trial")) {
				groupedSettings.TRIAL.push(setting);
			} else if (
				setting.settingKey.includes("Refund") ||
				setting.settingKey.includes("Lead")
			) {
				groupedSettings.POLICY.push(setting);
			} else {
				groupedSettings.OTHER.push(setting);
			}
		}

		return { rawSettings: settings, groupedSettings };
	}

	static async getAdminTeachers() {
		await requireAuth([UserType.ADMIN]);
		const teachers = await prisma.teacher.findMany({
			include: {
				user: true,
				subjects: { include: { subject: true } },
			},
			orderBy: { user: { name: "asc" } },
		});
		return teachers.map((t) => ({
			...t,
			specialization:
				t.subjects?.map((s) => s.subject.name).join(", ") || "غير محدد",
			averageRating: Number(t.averageRating),
		}));
	}

	static async getAdminUsers() {
		await requireAuth([UserType.ADMIN]);
		return prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				userType: true,
				isActive: true,
				createdAt: true,
				students: {
					select: {
						id: true,
						name: true,
						grade: true,
						school: true,
					},
				},
				teacher: {
					select: {
						id: true,
						subjects: { include: { subject: true } },
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}

	static async getAdminVerifications() {
		await requireAuth([UserType.ADMIN]);
		return prisma.teacherVerification.findMany({
			where: { reviewedAt: null },
			include: {
				teacher: {
					include: {
						user: true,
						subjects: { include: { subject: true } },
					},
				},
			},
			orderBy: { createdAt: "asc" },
		});
	}

	static async getHomepageData() {
		return prisma.systemSetting.findUnique({
			where: { settingKey: "HomepageLayout" },
		});
	}
}
