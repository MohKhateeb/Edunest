import {getRequestConfig} from 'next-intl/server'

const VALID_LOCALES = ['ar', 'en'] as const
export type Locale = typeof VALID_LOCALES[number]
export const defaultLocale: Locale = 'ar'

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale

  if (!locale || !VALID_LOCALES.includes(locale as Locale)) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'Asia/Jerusalem',
    now: new Date(),
  }
})
