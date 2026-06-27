"use client";

import { useState } from "react";
import { AlertTriangle, Clock, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";
import type { DetailedBooking } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import ReportModal from "@/components/shared/ReportModal";

export default function PendingReportsClient({
	initialBookings,
}: {
	initialBookings: DetailedBooking[];
}) {
	const [bookings, setBookings] = useState(initialBookings);
	const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

	function handleSuccess() {
		if (activeBookingId) {
			setBookings((prev) => prev.filter((b) => b.id !== activeBookingId));
			setActiveBookingId(null);
		}
	}

	return (
		<div className="space-y-6 text-right" dir="rtl">
			{bookings.length === 0 ? (
				<div className="bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground">
					<CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4 opacity-75" />
					<h3 className="font-bold text-lg text-foreground mb-1">عمل رائع! 🏆</h3>
					<p className="text-sm">لا توجد لديك أي جلسات معلقة أو تقارير متأخرة حالياً.</p>
				</div>
			) : (
				<div className="grid gap-4">
					{bookings.map((booking) => {
						const isFrozen = booking.reportWarningLevel === 2;
						const isWarned = booking.reportWarningLevel === 1;

						let statusText = "في فترة السماح (أقل من 24 ساعة)";
						let statusClass = "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
						let Icon = Clock;

						if (isFrozen) {
							statusText = "الرصيد مجمد - تحذير نهائي!";
							statusClass = "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
							Icon = ShieldAlert;
						} else if (isWarned) {
							statusText = "تحذير: تقرير متأخر (> 24 ساعة)";
							statusClass = "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
							Icon = AlertTriangle;
						}

						return (
							<div
								key={booking.id}
								className={`bg-white dark:bg-card border-2 rounded-3xl p-5 shadow-xs transition-all ${
									isFrozen
										? "border-red-200 dark:border-red-900/40"
										: isWarned
										? "border-orange-200 dark:border-orange-900/40"
										: "border-border"
								}`}
							>
								<div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
									<div className="space-y-2">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-black text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
												جلسة {booking.student.name}
											</span>
											<div className={`flex items-center gap-1 border px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass}`}>
												<Icon className="h-3.5 w-3.5" />
												<span>{statusText}</span>
											</div>
										</div>
										<div className="text-xs text-muted-foreground space-y-1">
											<p>
												<span className="font-semibold text-foreground">المادة/الخدمة:</span>{" "}
												{booking.teacherService.serviceType.name}
											</p>
											<p>
												<span className="font-semibold text-foreground">تاريخ الجلسة:</span>{" "}
												{new Date(booking.startTime).toLocaleString("ar-EG")}
											</p>
											<p>
												<span className="font-semibold text-foreground">قيمة الجلسة:</span>{" "}
												{formatPrice(Number(booking.price))}
											</p>
										</div>
									</div>
									<button
										onClick={() => setActiveBookingId(booking.id)}
										className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 px-5 py-2.5 rounded-xl transition-all shadow-sm"
									>
										<FileText className="h-4 w-4" />
										كتابة التقرير الآن
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{activeBookingId && (
				<ReportModal
					bookingId={activeBookingId}
					onClose={() => setActiveBookingId(null)}
					onSuccess={handleSuccess}
				/>
			)}
		</div>
	);
}
