"use client";

import { HelpCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import BookingCard from "@/components/shared/BookingCard";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import type { DetailedBooking } from "@/lib/types";
import { getDetailedSessionState } from "@/lib/utils/booking-state";

interface ParentBookingsListProps {
	bookings: DetailedBooking[];
}

export default function ParentBookingsList({
	bookings,
}: ParentBookingsListProps) {
	type TabType = "UPCOMING" | "PENDING" | "COMPLETED" | "ARCHIVED";
	const [activeTab, setActiveTab] = useState<TabType>("UPCOMING");
	const [searchQuery, setSearchQuery] = useState("");

	const upcomingCount = bookings.filter((b) => b.status === "CONFIRMED").length;
	const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
	const reportsCount = bookings.filter(
		(b) => b.status === "COMPLETED" && b.report,
	).length;

	const ghostCount = bookings.filter(
		(b) =>
			b.status === "CONFIRMED" &&
			getDetailedSessionState(b.startTime, b.duration).status === "ghost",
	).length;

	// 2. فلترة البيانات حسب التبويب النشط والبحث
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
					return b.status === "PENDING";
				case "COMPLETED":
					return b.status === "COMPLETED";
				case "ARCHIVED":
					return b.status === "CANCELLED" || b.status === "REJECTED";
				default:
					return true;
			}
		});
	};

	const filtered = getFilteredData();

	return (
		<div className="space-y-6 text-right" dir="rtl">
			{/* 📊 ملخص ذكي بدلاً من البطاقات المزدحمة */}
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

			{/* 🔍 أدوات التحكم والبحث - تصميم هادئ ومريح */}
			<div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-2xl border border-border/50 shadow-sm">
				{/* أزرار التبويبات الفعالة */}
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

				{/* شريط البحث المدمج */}
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

			{/* 📭 عرض النتائج والبطاقات */}
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
						<BookingCard key={booking.id} booking={booking} role="PARENT" />
					))}
				</div>
			)}
		</div>
	);
}
