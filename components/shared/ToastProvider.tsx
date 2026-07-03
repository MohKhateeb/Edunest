"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
	return (
		<Toaster
			position="top-center"
			dir="rtl"
			richColors
			expand={false}
			toastOptions={{
				className:
					"font-sans rtl text-right border-border bg-card text-foreground shadow-lg rounded-xl",
				style: {
					fontFamily: "var(--font-sans)",
				},
				classNames: {
					toast: "group flex gap-3 p-4 border shadow-xl rounded-xl w-full",
					title: "font-bold text-sm",
					description: "text-xs text-muted-foreground",
					actionButton:
						"bg-primary text-primary-foreground font-semibold rounded-lg text-xs px-3 py-1.5",
					cancelButton:
						"bg-muted text-muted-foreground font-semibold rounded-lg text-xs px-3 py-1.5",
					success:
						"bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
					error:
						"bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900",
					info: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
					warning:
						"bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900",
				},
			}}
		/>
	);
}
