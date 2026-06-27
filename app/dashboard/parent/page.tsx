import { UserType } from "@prisma/client";
import {
	Bell,
	Calendar,
	CalendarPlus,
	CheckCircle,
	Clock,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import BookingCard from "@/components/shared/BookingCard";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import { requireAuth } from "@/lib/require-auth";
import { getParentDashboardInsights } from "@/lib/services/parent-dashboard";
import { formatLocalTime } from "@/lib/utils";

export default async function ParentDashboard() {
	const { userId } = await requireAuth([UserType.PARENT]);
	// To get the user's name, we can still fetch the session, but requireAuth already proved they are active.
	const { auth } = await import("@/lib/auth");
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	const userName = session?.user?.name || "ولي الأمر";

	// Fetch clean data from our service
	const insights = await getParentDashboardInsights(userId, userName);

	return (
		<div className="space-y-8 text-right pb-10" dir="rtl">
			{/* قسم الترحيب ونجيب */}
			<div className="mt-4">
				<InteractiveMessage
					character="najeeb"
					title={`أهلاً بك، ${userName} 👋`}
					message={insights.najeebMessage}
					najeebMode={insights.najeebMode}
					className="lg:w-3/4"
				/>
				<div className="mt-6 pr-4 sm:pr-20">
					<Link
						href="/dashboard/parent/live"
						className="inline-flex items-center gap-2 bg-gradient-to-l from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:scale-105 px-6 py-3 rounded-2xl text-sm font-black shadow-md transition-all cursor-pointer animate-pulse-soft"
					>
						<Zap className="h-5 w-5 text-yellow-300" />
						فزعة سريعة (Live Radar)
					</Link>
				</div>
			</div>

			{/* قسم موجز الحكيم */}
			<div className="pt-2 border-t border-border/50">
				<InteractiveMessage
					character="hakeem"
					title="موجز الحكيم"
					message={insights.hakeemMessage}
				/>

				{/* إحصائيات داعمة للحكيم */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
					<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
						<span className="text-3xl font-black text-primary mb-1">
							{insights.stats.studentCount}
						</span>
						<span className="text-xs text-muted-foreground font-bold">
							عدد الأبناء
						</span>
					</div>
					<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
						<span className="text-3xl font-black text-secondary mb-1">
							{insights.stats.upcomingBookingsCount}
						</span>
						<span className="text-xs text-muted-foreground font-bold">
							جلسات قادمة
						</span>
					</div>
					<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
						<span className="text-3xl font-black text-accent-2 mb-1">
							{insights.stats.studyHours}
						</span>
						<span className="text-xs text-muted-foreground font-bold">
							ساعات الدراسة
						</span>
					</div>
					<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
						<span className="text-3xl font-black text-amber-500 mb-1">
							{insights.stats.avgRating}/5
						</span>
						<span className="text-xs text-muted-foreground font-bold">
							متوسط التقييم
						</span>
					</div>
				</div>
			</div>

			{/* Main Content Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-border/50">
				{/* Next Session Panel */}
				<div className="lg:col-span-2 space-y-4">
					<h2 className="font-black text-lg flex items-center gap-2">
						<Calendar className="h-6 w-6 text-primary" />
						الجلسة القادمة المؤكدة
					</h2>

					<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
						{insights.nextSession ? (
							<BookingCard booking={insights.nextSession} role="PARENT" />
						) : (
							<div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border">
								<p className="text-sm text-muted-foreground font-semibold">
									لا توجد جلسات مؤكدة قادمة مجدولة حالياً.
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Notifications Sidebar */}
				<div className="space-y-4">
					<h2 className="font-black text-lg flex items-center gap-2">
						<Bell className="h-6 w-6 text-secondary" />
						آخر الإشعارات
					</h2>

					<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-5 shadow-sm space-y-3">
						{insights.notifications.length === 0 ? (
							<p className="text-sm text-muted-foreground py-6 text-center font-semibold">
								لا توجد إشعارات جديدة.
							</p>
						) : (
							insights.notifications.map((n) => (
								<div
									key={n.id}
									className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border/50 transition-all hover:border-primary/30"
								>
									<div className="font-black text-foreground mb-1 text-sm">
										{n.title}
									</div>
									<p className="text-muted-foreground leading-relaxed text-xs font-medium">
										{n.message}
									</p>
									<span className="text-[10px] text-muted-foreground/60 block mt-2 font-bold">
										{new Date(n.createdAt).toLocaleDateString("ar-EG")}
									</span>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
