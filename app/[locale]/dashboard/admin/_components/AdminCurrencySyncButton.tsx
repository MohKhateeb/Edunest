"use client";

import { useState } from "react";
import { RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { syncExchangeRatesAction } from "@/lib/actions/admin";

export default function AdminCurrencySyncButton() {
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [error, setError] = useState<string | null>(null);

	const handleSync = async () => {
		setLoading(true);
		setStatus("idle");
		setError(null);
		
		const res = await syncExchangeRatesAction();
		if (res.success) {
			setStatus("success");
		} else {
			setStatus("error");
			setError(res.error || "Failed to sync");
		}
		
		setLoading(false);
		
		setTimeout(() => {
			setStatus("idle");
		}, 5000);
	};

	return (
		<div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
			<div>
				<h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
					<RefreshCw className="w-5 h-5 text-primary" />
					مزامنة أسعار الصرف
				</h2>
				<p className="text-sm text-slate-500 mt-1">
					يتم جلب أسعار الصرف بشكل مباشر من مزود الخدمة لتحديث العملات الافتراضية
				</p>
			</div>
			
			<div className="flex items-center gap-3">
				{status === "success" && (
					<span className="text-emerald-600 text-sm font-bold flex items-center gap-1">
						<CheckCircle2 className="w-4 h-4" /> تم التحديث
					</span>
				)}
				{status === "error" && (
					<span className="text-rose-600 text-sm font-bold flex items-center gap-1">
						<AlertCircle className="w-4 h-4" /> {error}
					</span>
				)}
				<button
					onClick={handleSync}
					disabled={loading}
					className="bg-primary/10 hover:bg-primary/20 text-primary px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
				>
					{loading ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						<RefreshCw className="w-4 h-4" />
					)}
					{loading ? "جاري التحديث..." : "تحديث الآن"}
				</button>
			</div>
		</div>
	);
}
