import { UserType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function getAllEscrows(
	from?: string,
	to?: string,
	params: { cursor?: string; take?: number } = {}
) {
	await requireAuth([UserType.ADMIN]);
	const PAGE_SIZE = 20;

	const whereClause: Prisma.AdminEscrowWhereInput = {};
	if (from) {
		whereClause.createdAt = { gte: new Date(from) };
	}
	if (to) {
		const end = new Date(to);
		end.setHours(23, 59, 59, 999);
		whereClause.createdAt = { ...whereClause.createdAt, lte: end };
	}

	const items = await prisma.adminEscrow.findMany({
		take: (params.take ?? PAGE_SIZE) + 1,
		...(params.cursor && { cursor: { id: params.cursor }, skip: 1 }),
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

	const hasMore = items.length > (params.take ?? PAGE_SIZE);
	const data = hasMore ? items.slice(0, -1) : items;
	const nextCursor = hasMore ? data[data.length - 1].id : null;

	return { items: data, nextCursor };
}
