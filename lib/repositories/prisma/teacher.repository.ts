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

	async upsert(where: Prisma.TeacherWhereUniqueInput, create: Prisma.TeacherUncheckedCreateInput | Prisma.TeacherCreateInput, update: Prisma.TeacherUncheckedUpdateInput | Prisma.TeacherUpdateInput, tx?: DbClient): Promise<any> {
		return this.getClient(tx).teacher.upsert({ where, create, update });
	}

	async findBySlug(slug: string, options?: { include?: Prisma.TeacherInclude }, tx?: DbClient): Promise<any | null> {
		return this.getClient(tx).teacher.findUnique({ where: { slug }, include: options?.include });
	}

	async findByUserId(userId: string, options?: { include?: Prisma.TeacherInclude }, tx?: DbClient): Promise<any | null> {
		return this.getClient(tx).teacher.findUnique({ where: { userId }, include: options?.include });
	}

	async update(id: string, data: Prisma.TeacherUncheckedUpdateInput | Prisma.TeacherUpdateInput, tx?: DbClient): Promise<any> {
		return this.getClient(tx).teacher.update({ where: { id }, data });
	}

	async updateAvailability(id: string, isAvailableNow: boolean, tx?: DbClient): Promise<any> {
		return this.getClient(tx).teacher.update({ where: { id }, data: { isAvailableNow } });
	}
}

export const teacherRepository = new PrismaTeacherRepository();
