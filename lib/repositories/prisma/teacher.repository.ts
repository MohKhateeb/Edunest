import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient, ITeacherRepository } from "../types";

export class PrismaTeacherRepository implements ITeacherRepository {
	private getClient(tx?: DbClient) {
		return tx || prisma;
	}

	async create(data: Prisma.TeacherUncheckedCreateInput, tx?: DbClient): Promise<any> {
		return this.getClient(tx).teacher.create({ data });
	}
}
