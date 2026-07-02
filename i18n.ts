import {getRequestConfig} from 'next-intl/server'

const VALID_LOCALES = ['ar', 'en'] as const
export type Locale = typeof VALID_LOCALES[number]

export default getRequestConfig(async ({requestLocale}) => {
  const locale = await requestLocale;
  const safeLocale = locale === 'en' ? 'en' : 'ar';
  return {
    locale: safeLocale,
    messages: (await import(`./messages/${safeLocale}.json`)).default,
    timeZone: 'Asia/Jerusalem',
    now: new Date(),
  }
})
