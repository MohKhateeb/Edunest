import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DbClient, ISystemSettingRepository } from "../types";

export class PrismaSystemSettingRepository implements ISystemSettingRepository {
	private getClient(tx?: DbClient) {
		return tx || prisma;
	}

	async upsert(key: string, value: any, description?: string, updatedBy?: string, tx?: DbClient): Promise<any> {
		return this.getClient(tx).systemSetting.upsert({
			where: { settingKey: key },
			update: { settingValue: value, updatedBy },
			create: { settingKey: key, settingValue: value, description, updatedBy },
		});
	}

	async findByKey(key: string, tx?: DbClient): Promise<any | null> {
		return this.getClient(tx).systemSetting.findUnique({
			where: { settingKey: key },
		});
	}

	async update(key: string, value: any, tx?: DbClient): Promise<any> {
		return this.getClient(tx).systemSetting.update({
			where: { settingKey: key },
			data: value,
		});
	}
}

export const systemSettingRepository = new PrismaSystemSettingRepository();
