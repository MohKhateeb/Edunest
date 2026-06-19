import { prisma } from '@/lib/prisma';
import { cache } from 'react';

export const getSetting = cache(async (key: string): Promise<string | null> => {
  const setting = await prisma.systemSetting.findUnique({
    where: { settingKey: key },
  });
  return setting?.settingValue ?? null;
});

export async function getSettingNumber(key: string, defaultValue = 0): Promise<number> {
  const val = await getSetting(key);
  if (!val) return defaultValue;
  const num = parseFloat(val);
  return isNaN(num) ? defaultValue : num;
}

export async function getSettingBool(key: string, defaultValue = false): Promise<boolean> {
  const val = await getSetting(key);
  if (!val) return defaultValue;
  return val === 'true';
}
