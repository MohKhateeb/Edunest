import type { Metadata } from "next";
import "./globals.css";
import ClientProvider from "@/components/shared/ClientProvider";

import ToastProvider from "@/components/shared/ToastProvider";

export const metadata: Metadata = {
	title: "منصة إديونست | EduNest",
	description:
		"المنصة الفلسطينية الأولى لربط أولياء الأمور بمعلمي الدروس الخصوصية الأكفاء في الضفة الغربية بطريقة منظمة وموثوقة.",
};

import {cookies} from 'next/headers'

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const cookieStore = await cookies();
	const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'ar'
	const dir = locale === 'ar' ? 'rtl' : 'ltr'

	return (
		<html lang={locale} dir={dir}>
			<body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
				<ClientProvider>
					{children}
					<ToastProvider />
				</ClientProvider>
			</body>
		</html>
	);
}
