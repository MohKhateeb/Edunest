import {NextIntlClientProvider} from 'next-intl'
import {getMessages} from 'next-intl/server'
import {notFound} from 'next/navigation'

const LOCALES = ['ar', 'en']

export default async function LocaleLayout({
  children,
  params: {locale},
}: {
  children: React.ReactNode
  params: {locale: string}
}) {
  if (!LOCALES.includes(locale)) notFound()
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  )
}

export function generateStaticParams() {
  return LOCALES.map(locale => ({locale}))
}
