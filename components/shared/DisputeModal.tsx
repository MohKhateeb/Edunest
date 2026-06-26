"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createDispute } from "@/lib/actions/disputes";

export function DisputeModal({
	bookingId,
	onClose,
}: {
	bookingId: string;
	onClose: () => void;
}) {
	const [reason, setReason] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (reason.length < 10) {
			setError("يرجى كتابة تفاصيل الاعتراض بشكل واضح (10 أحرف على الأقل).");
			return;
		}

		setLoading(true);
		setError("");

		const res = await createDispute({ bookingId, reason });
		if (res.success) {
			router.refresh();
			onClose();
		} else {
			setError(res.error || "حدث خطأ أثناء إرسال الاعتراض");
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
			<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>

				<div className="flex items-center gap-3 mb-6">
					<div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center shrink-0">
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							></path>
						</svg>
					</div>
					<div>
						<h3 className="text-xl font-bold text-gray-900 dark:text-white">
							تقديم اعتراض على الجلسة
						</h3>
						<p className="text-gray-500 dark:text-gray-400 text-sm">
							سيتم تجميد الدفع للمعلم حتى تفصل الإدارة في الأمر.
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							تفاصيل المشكلة
						</label>
						<textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none text-gray-900 dark:text-white"
							rows={5}
							placeholder="يرجى كتابة سبب الاعتراض بوضوح (مثال: المعلم لم يحضر، انقطاع متكرر للاتصال، الخ...)"
							disabled={loading}
						></textarea>
					</div>

					{error && (
						<div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
							{error}
						</div>
					)}

					<div className="flex gap-3">
						<button
							type="submit"
							disabled={loading}
							className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex justify-center items-center disabled:opacity-70"
						>
							{loading ? "جاري الإرسال..." : "تأكيد إرسال الاعتراض"}
						</button>
						<button
							type="button"
							onClick={onClose}
							disabled={loading}
							className="px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all duration-200"
						>
							إلغاء
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
