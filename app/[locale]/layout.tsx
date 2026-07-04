import {NextIntlClientProvider} from 'next-intl'
import {getMessages, setRequestLocale, getTranslations } from 'next-intl/server'
import {notFound} from 'next/navigation'
import type { Metadata } from "next";
import "../globals.css";
import ClientProvider from "@/components/shared/ClientProvider";
import ToastProvider from "@/components/shared/ToastProvider";

const LOCALES = ['ar', 'en']

export async function generateMetadata({params}: any) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const t = await getTranslations({locale, namespace: 'common'});
  return {
    title: t('str_2YXZhti1'),
    description: "EduNest platform"
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{locale: string}>
}) {

  const { locale } = await params;
  if (!LOCALES.includes(locale)) notFound()
  setRequestLocale(locale);
  
  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  
  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        <ClientProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <ToastProvider />
          </NextIntlClientProvider>
        </ClientProvider>
      </body>
    </html>
  )
}

export function generateStaticParams() {
  return LOCALES.map(locale => ({locale}))
}
