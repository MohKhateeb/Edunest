"use client";

import { HelpCircle, Search } from "lucide-react";
import { useState } from "react";
import BookingCard from "@/components/shared/BookingCard";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import PaymentCountdown from "./PaymentCountdown";
import type { DetailedBooking } from "@/lib/types";

interface ParentBookingsListProps {
	bookings: DetailedBooking[];
	insights: {
		upcomingCount: number;
		pendingCount: number;
		reportsCount: number;
		ghostCount: number;
	};
}

export default function ParentBookingsList({
	bookings,
	insights,
}: ParentBookingsListProps) {
	type TabType = "UPCOMING" | "PENDING" | "COMPLETED" | "ARCHIVED";
	const [activeTab, setActiveTab] = useState<TabType>("UPCOMING");
	const [searchQuery, setSearchQuery] = useState("");

	const { upcomingCount, pendingCount, reportsCount, ghostCount } = insights;

	const getFilteredData = () => {
		return bookings.filter((b) => {
			const query = searchQuery.toLowerCase().trim();
			const matchesSearch =
				b.student.name.toLowerCase().includes(query) ||
				b.teacherService.teacher.user.name.toLowerCase().includes(query) ||
				b.teacherService.serviceType.name.toLowerCase().includes(query);

			if (!matchesSearch) return false;

			switch (activeTab) {
				case "UPCOMING":
					return b.status === "CONFIRMED";
				case "PENDING":
					return (
						b.status === "PENDING" ||
						b.status === "PENDING_APPROVAL" ||
						b.status === "AWAITING_PAYMENT"
					);
				case "COMPLETED":
					return b.status === "COMPLETED";
				case "ARCHIVED":
					return (
						b.status === "CANCELLED" ||
						b.status === "REJECTED" ||
						b.status === "EXPIRED"
					);
				default:
					return true;
			}
		});
	};

	const filtered = getFilteredData();

	return (
		<div className="space-y-6 text-right" dir="rtl">
			<InteractiveMessage
				character="najeeb"
				najeebMode={
					ghostCount > 0 ? "help" : upcomingCount > 0 ? "study" : "welcome"
				}
				message={
					ghostCount > 0
						? `انتباه! هناك ${ghostCount} جلسة انتهت منذ فترة ولم يقم المعلم بإنهاء إغلاقها ورفع التقرير. يرجى المتابعة مع المعلم.`
						: `لدينا ${upcomingCount} حصص قادمة، و ${reportsCount} تقارير تعليمية للاطلاع عليها. يمكنك التبديل بين التبويبات بالأسفل لرؤية التفاصيل بسهولة!`
				}
			/>

			<div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-2xl border border-border/50 shadow-sm">
				<div className="flex w-full md:w-auto overflow-x-auto scrollbar-none gap-2">
					{[
						{ id: "UPCOMING", label: `القادمة (${upcomingCount})` },
						{ id: "PENDING", label: `المعلقة (${pendingCount})` },
						{ id: "COMPLETED", label: "المنتهية" },
						{ id: "ARCHIVED", label: "الأرشيف" },
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id as TabType)}
							className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
								activeTab === tab.id
									? "bg-primary text-white shadow-md"
									: "bg-slate-50 dark:bg-slate-800 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-700"
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				<div className="relative w-full md:w-72">
					<div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
						<Search className="h-4 w-4 text-muted-foreground" />
					</div>
					<input
						type="text"
						placeholder="ابحث هنا..."
						className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-border/50 rounded-xl pr-9 pl-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{filtered.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-border/50 border-dashed rounded-3xl text-center shadow-sm">
					<HelpCircle className="h-10 w-10 text-muted-foreground/40 mb-3 animate-pulse" />
					<p className="text-sm font-bold text-foreground/80">
						لا توجد حصص في هذا القسم
					</p>
					<p className="text-xs text-muted-foreground mt-1">
						{searchQuery
							? "جرب البحث بكلمات أخرى أو تغيير تبويب الفلترة."
							: "لم تقم بجدولة أي حصص هنا بعد."}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
					{filtered.map((booking) => (
						<div key={booking.id} className="relative flex flex-col gap-3 h-full">
							<BookingCard booking={booking} role="PARENT" />

							{booking.status === "PENDING_APPROVAL" && (
								<div className="text-center text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-xl py-2.5 px-3 animate-in fade-in">
									بانتظار رد المعلم على طلبك
								</div>
							)}

							{booking.status === "AWAITING_PAYMENT" && (
								<PaymentCountdown
									bookingId={booking.id}
									price={Number(booking.price)}
									paymentDeadline={booking.paymentDeadline}
								/>
							)}

							{booking.status === "EXPIRED" && (
								<div className="text-center text-xs font-bold text-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3">
									انتهت مهلة الدفع المحددة
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
