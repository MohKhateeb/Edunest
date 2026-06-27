import { UserType } from "@prisma/client";
import {
	CheckCircle,
	GraduationCap,
	ShieldCheck,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import AdminAnalyticsCharts from "@/components/shared/charts/AdminAnalyticsCharts";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { getAdminDashboardOverview } from "@/lib/services/domain/analytics-service";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboard() {
	await requireAuth([UserType.ADMIN]);
	const session = await auth();
	await requireAuth([UserType.ADMIN]);

	if (!session) return null;
	const {
		pendingVerifications,
		totalBookings,
		totalStudents,
		activeTeachers,
		averageOrderValue,
		completionRate,
		bookingStatuses,
		revenueData,
		requestedSpecializations,
		sessionTypes,
		registeredGrades,
	} = await getAdminDashboardOverview();

	return (
		<div className="space-y-8 text-right pb-10" dir="rtl">
			{/* Welcome header & Interactive Message */}
			<div className="mt-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
				<InteractiveMessage
					character="hakeem"
					title={`أهلاً بك، ${session.user.name}`}
					message="تتيح لك لوحة القيادة مراقبة مؤشرات الأداء الرئيسية (KPIs)، وتحليل اتجاهات الطلب الفعلي، وإدارة التدفقات المالية للمنصة بشكل مباشر. راقب الأرقام لضمان النمو."
					className="lg:w-2/3"
				/>
				{pendingVerifications > 0 && (
					<Link
						href="/dashboard/admin/verification"
						className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-4 rounded-2xl shadow-md transition-all font-black flex items-center gap-2 animate-pulse-soft"
					>
						<ShieldCheck className="h-5 w-5" />
						توثيق معلمين
						<span className="bg-white text-yellow-600 text-xs px-2 py-0.5 rounded-full mr-2">
							{pendingVerifications}
						</span>
					</Link>
				)}
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
				<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
					<div className="p-2 bg-sky-50 dark:bg-sky-950/30 text-sky-600 rounded-2xl mb-2">
						<GraduationCap className="h-5 w-5" />
					</div>
					<span className="text-2xl font-black text-foreground mb-1">
						{totalStudents}
					</span>
					<span className="text-xs text-muted-foreground font-bold">
						إجمالي الطلاب
					</span>
				</div>

				<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
					<div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl mb-2">
						<Users className="h-5 w-5" />
					</div>
					<span className="text-2xl font-black text-foreground mb-1">
						{activeTeachers}
					</span>
					<span className="text-xs text-muted-foreground font-bold">
						معلمين نشطين
					</span>
				</div>

				<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
					<div className="p-2 bg-purple-50 dark:bg-purple-950/30 text-purple-600 rounded-2xl mb-2">
						<TrendingUp className="h-5 w-5" />
					</div>
					<span className="text-2xl font-black text-foreground mb-1">
						{formatPrice(averageOrderValue)}
					</span>
					<span className="text-xs text-muted-foreground font-bold">
						متوسط الدفع (AOV)
					</span>
				</div>

				<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
					<div className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-600 rounded-2xl mb-2">
						<CheckCircle className="h-5 w-5" />
					</div>
					<div className="flex items-baseline gap-1">
						<span className="text-2xl font-black text-foreground mb-1">
							{completionRate}
						</span>
						<span className="text-sm font-bold text-muted-foreground">%</span>
					</div>
					<span className="text-xs text-muted-foreground font-bold">
						إكمال الحجوزات
					</span>
				</div>
			</div>

			{/* Analytics Charts Component */}
			<AdminAnalyticsCharts
				bookingStatuses={bookingStatuses}
				requestedSpecializations={requestedSpecializations}
				sessionTypes={sessionTypes}
				registeredGrades={registeredGrades}
				revenue={revenueData}
			/>
		</div>
	);
}
