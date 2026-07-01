import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient, ITeacherVerificationRepository } from "../types";

export class PrismaTeacherVerificationRepository implements ITeacherVerificationRepository {
	private getClient(tx?: DbClient) {
		return tx || prisma;
	}

	async update(teacherId: string, data: Prisma.TeacherVerificationUncheckedUpdateInput | Prisma.TeacherVerificationUpdateInput, tx?: DbClient): Promise<any> {
		return this.getClient(tx).teacherVerification.update({
			where: { teacherId },
			data,
		});
	}

	async findByTeacherId(teacherId: string, tx?: DbClient): Promise<any | null> {
		return this.getClient(tx).teacherVerification.findUnique({
			where: { teacherId },
		});
	}
}

export const teacherVerificationRepository = new PrismaTeacherVerificationRepository();
