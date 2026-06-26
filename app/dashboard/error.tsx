"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error(error);
	}, [error]);

	return (
		<div
			className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4"
			dir="rtl"
		>
			<div className="bg-red-50 dark:bg-red-950/30 p-6 rounded-full border border-red-100 dark:border-red-900">
				<AlertCircle className="w-16 h-16 text-red-500" />
			</div>
			<div className="space-y-2">
				<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
					عذراً، حدث خطأ غير متوقع
				</h2>
				<p className="text-slate-500 dark:text-slate-400 max-w-md">
					يبدو أن هناك مشكلة في تحميل هذه الصفحة. نحن نعتذر عن هذا الخلل.
				</p>
			</div>
			<button
				onClick={() => reset()}
				className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-500/20"
			>
				<RefreshCcw className="w-4 h-4" />
				حاول مرة أخرى
			</button>
		</div>
	);
}
