import { Currency } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getSetting = unstable_cache(
	async (key: string): Promise<string | null> => {
		const setting = await prisma.systemSetting.findUnique({
			where: { settingKey: key },
		});
		return setting?.settingValue ?? null;
	},
	["system-settings-fetch"],
	{ tags: ["system-settings"], revalidate: 3600 },
);

export async function getSettingNumber(
	key: string,
	defaultValue = 0,
): Promise<number> {
	const val = await getSetting(key);
	if (!val) return defaultValue;
	const num = parseFloat(val);
	return isNaN(num) ? defaultValue : num;
}

export async function getSettingBool(
	key: string,
	defaultValue = false,
): Promise<boolean> {
	const val = await getSetting(key);
	if (!val) return defaultValue;
	return val === "true";
}

export async function getSettingCurrency(
	key: string,
	defaultValue: Currency = Currency.ILS,
): Promise<Currency> {
	const val = await getSetting(key);
	if (!val) return defaultValue;
	// Validate if val is a valid Currency enum
	if (Object.values(Currency).includes(val as Currency)) {
		return val as Currency;
	}
	return defaultValue;
}
