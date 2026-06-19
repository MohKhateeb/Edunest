import type { Metadata } from "next";
import "./globals.css";
import ClientProvider from "@/components/shared/ClientProvider";

import ToastProvider from '@/components/shared/ToastProvider';

export const metadata: Metadata = {
  title: "منصة إيدونِست | EduNest",
  description: "المنصة الفلسطينية الأولى لربط أولياء الأمور بمعلمي الدروس الخصوصية الأكفاء في الضفة الغربية بطريقة منظمة وموثوقة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        <ClientProvider>
          {children}
          <ToastProvider />
        </ClientProvider>
      </body>
    </html>
  );
}
