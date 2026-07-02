import {getRequestConfig} from 'next-intl/server'

const VALID_LOCALES = ['ar', 'en'] as const
export type Locale = typeof VALID_LOCALES[number]

export default getRequestConfig(async ({locale}) => {
  const safeLocale = VALID_LOCALES.includes(locale as Locale) ? locale : 'ar'
  return {
    locale: safeLocale,
    messages: (await import(`./messages/${safeLocale}.json`)).default,
    timeZone: 'Asia/Jerusalem',
    now: new Date(),
  }
})
