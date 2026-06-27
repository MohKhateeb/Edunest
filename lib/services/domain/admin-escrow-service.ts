import { UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function getAllEscrows(from?: string, to?: string) {
	await requireAuth([UserType.ADMIN]);

	const whereClause: any = {};
	if (from) {
		whereClause.createdAt = { gte: new Date(from) };
	}
	if (to) {
		const end = new Date(to);
		end.setHours(23, 59, 59, 999);
		whereClause.createdAt = { ...whereClause.createdAt, lte: end };
	}

	return await prisma.adminEscrow.findMany({
		where: whereClause,
		include: {
			booking: {
				include: {
					student: true,
					teacherService: {
						include: { teacher: { include: { user: true } } },
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});
}
