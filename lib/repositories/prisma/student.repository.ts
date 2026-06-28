import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient, IStudentRepository } from "../types";

export class PrismaStudentRepository implements IStudentRepository {
	private getClient(tx?: DbClient) {
		return tx || prisma;
	}

	async create(data: Prisma.StudentUncheckedCreateInput, tx?: DbClient): Promise<any> {
		return this.getClient(tx).student.create({ data });
	}

	async findById(
		id: string,
		options?: { include?: Prisma.StudentInclude },
		tx?: DbClient,
	): Promise<any | null> {
		return this.getClient(tx).student.findUnique({
			where: { id },
			include: options?.include,
		});
	}

	async update(id: string, data: Prisma.StudentUpdateInput, tx?: DbClient): Promise<any> {
		return this.getClient(tx).student.update({ where: { id }, data });
	}
}
