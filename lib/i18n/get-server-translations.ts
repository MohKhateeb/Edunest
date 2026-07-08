import { getLocale, getTranslations } from 'next-intl/server';

export async function getErrorT() {
  const locale = await getLocale();
  return getTranslations({ locale, namespace: 'errors' });
}

export async function getNotificationT() {
  const locale = await getLocale();
  return getTranslations({ locale, namespace: 'notifications' });
}

export async function getValidationT() {
  const locale = await getLocale();
  return getTranslations({ locale, namespace: 'validation' });
}
