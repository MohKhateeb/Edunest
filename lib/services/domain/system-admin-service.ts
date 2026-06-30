import { UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export class SystemAdminService {
	static async getAdminDisputes(
		params: { cursor?: string; take?: number } = {},
	) {
		await requireAuth([UserType.ADMIN]);
		const PAGE_SIZE = 100;
		const items = await prisma.dispute.findMany({
			take: (params.take ?? PAGE_SIZE) + 1,
			...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
			include: {
				booking: {
					include: {
						student: { select: { name: true } },
						teacherService: {
							include: {
								teacher: { include: { user: { select: { name: true } } } },
							},
						},
						parent: { select: { name: true } },
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		const hasMore = items.length > (params.take ?? PAGE_SIZE);
		const data = hasMore ? items.slice(0, -1) : items;
		const nextCursor = hasMore ? data[data.length - 1].id : null;

		return { items: data, nextCursor };
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

	static async getAdminTeachers(
		params: { cursor?: string; take?: number } = {},
	) {
		await requireAuth([UserType.ADMIN]);
		const PAGE_SIZE = 20;
		const items = await prisma.teacher.findMany({
			take: (params.take ?? PAGE_SIZE) + 1,
			...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
			include: {
				user: true,
				subjects: { include: { subject: true } },
			},
			orderBy: { id: "asc" }, // Must order by unique field for cursor pagination
		});

		const hasMore = items.length > (params.take ?? PAGE_SIZE);
		const data = hasMore ? items.slice(0, -1) : items;
		const nextCursor = hasMore ? data[data.length - 1].id : null;

		return {
			items: data.map((t) => ({
				...t,
				specialization:
					t.subjects?.map((s) => s.subject.name).join(", ") || "غير محدد",
				averageRating: Number(t.averageRating),
			})),
			nextCursor,
		};
	}

	static async getAdminUsers(params: { cursor?: string; take?: number } = {}) {
		await requireAuth([UserType.ADMIN]);
		const PAGE_SIZE = 100;
		const items = await prisma.user.findMany({
			take: (params.take ?? PAGE_SIZE) + 1,
			...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
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

		const hasMore = items.length > (params.take ?? PAGE_SIZE);
		const data = hasMore ? items.slice(0, -1) : items;
		const nextCursor = hasMore ? data[data.length - 1].id : null;

		return { items: data, nextCursor };
	}

	static async getAdminVerifications(
		params: { cursor?: string; take?: number } = {},
	) {
		await requireAuth([UserType.ADMIN]);
		const PAGE_SIZE = 20;
		const items = await prisma.teacherVerification.findMany({
			take: (params.take ?? PAGE_SIZE) + 1,
			...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
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

		const hasMore = items.length > (params.take ?? PAGE_SIZE);
		const data = hasMore ? items.slice(0, -1) : items;
		const nextCursor = hasMore ? data[data.length - 1].id : null;

		return { items: data, nextCursor };
	}

	static async getHomepageData() {
		return prisma.systemSetting.findUnique({
			where: { settingKey: "HomepageLayout" },
		});
	}
}
