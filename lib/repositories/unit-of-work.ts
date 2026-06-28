import { prisma } from "@/lib/prisma";
import type { DbClient } from "./types";

export class PrismaUnitOfWork {
	async runTransaction<T>(callback: (tx: DbClient) => Promise<T>): Promise<T> {
		return prisma.$transaction(async (tx) => {
			return callback(tx);
		});
	}
}

export const unitOfWork = new PrismaUnitOfWork();
