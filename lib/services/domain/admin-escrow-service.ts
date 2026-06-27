import { UserType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function getAllEscrows() {
	await requireAuth([UserType.ADMIN]);

	return await prisma.adminEscrow.findMany({
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
