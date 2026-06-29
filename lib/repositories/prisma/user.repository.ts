import { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient, IUserRepository } from "../types";

export class PrismaUserRepository implements IUserRepository {
	private getClient(tx?: DbClient) {
		return tx || prisma;
	}

	async findById(id: string, options?: { include?: Prisma.UserInclude }, tx?: DbClient): Promise<any | null> {
		return this.getClient(tx).user.findUnique({ where: { id }, include: options?.include });
	}

	async findByEmail(email: string, options?: { include?: Prisma.UserInclude }, tx?: DbClient): Promise<any | null> {
		return this.getClient(tx).user.findUnique({ where: { email }, include: options?.include });
	}

	async findByEmailExcludingId(
		email: string,
		excludeId: string,
		tx?: DbClient,
	): Promise<User | null> {
		return this.getClient(tx).user.findFirst({
			where: { email, id: { not: excludeId } },
		});
	}

	async create(data: Prisma.UserCreateInput, tx?: DbClient): Promise<User> {
		return this.getClient(tx).user.create({ data });
	}

	async update(id: string, data: Prisma.UserUpdateInput, tx?: DbClient): Promise<User> {
		return this.getClient(tx).user.update({ where: { id }, data });
	}

	async delete(id: string, tx?: DbClient): Promise<User> {
		return this.getClient(tx).user.delete({ where: { id } });
	}
}

export const userRepository = new PrismaUserRepository();
