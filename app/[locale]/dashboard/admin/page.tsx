import { UserType } from "@prisma/client";
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	GraduationCap,
	ShieldAlert,
	ShieldCheck,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import AdminAnalyticsCharts from "@/components/shared/charts/AdminAnalyticsCharts";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { analyticsRepository } from "@/lib/repositories/analytics-repository";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboard() {
	await requireAuth([UserType.ADMIN]);
	const session = await auth();

	if (!session) return null;

	const end = new Date();
	const start = new Date();
	start.setDate(end.getDate() - 30);

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
		openDisputesCount,
		pendingPayoutsCount,
		pendingEscrowsCount,
	} = await analyticsRepository.getAdminDashboardStats(start, end);

	const hasUrgentMatters =
		pendingVerifications > 0 ||
		openDisputesCount > 0 ||
		pendingPayoutsCount > 0 ||
		pendingEscrowsCount > 0;

	return (
		<div className="space-y-8 text-right pb-10" dir="rtl">
			{/* Welcome header & Interactive Message */}
			<div className="mt-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
				<InteractiveMessage
					character="hakeem"
					title={`أهلاً بك، ${session.user.name}`}
					message="تتيح لك لوحة القيادة مراقبة مؤشرات الأداء الرئيسية (KPIs)، وإدارة التدفقات المالية للمنصة بشكل مباشر. راقب الأرقام لضمان النمو."
					className="lg:w-2/3"
				/>
			</div>

			{/* Action Center (Urgent Matters) */}
			<section className="bg-white/80 dark:bg-card/80 backdrop-blur-md rounded-3xl p-6 border-2 border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden">
				<div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
				<h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-red-700 dark:text-red-400">
					<AlertTriangle className="w-6 h-6" />
					مركز العمليات العاجلة (Action Center)
				</h2>
				
				{!hasUrgentMatters ? (
					<div className="text-center py-8 text-green-600 dark:text-green-400 font-bold flex flex-col items-center">
						<CheckCircle className="w-12 h-12 mb-3 opacity-50" />
						<p>كل الأمور تحت السيطرة! لا توجد مهام عاجلة حالياً.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{pendingVerifications > 0 && (
							<Link
								href="/dashboard/admin/verification"
								className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded-2xl border border-yellow-200 dark:border-yellow-900/50 transition-colors group"
							>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-yellow-200 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-xl group-hover:scale-110 transition-transform">
										<ShieldCheck className="w-5 h-5" />
									</div>
									<div className="font-bold text-yellow-900 dark:text-yellow-100">توثيق معلمين</div>
								</div>
								<span className="text-lg font-black text-yellow-600">{pendingVerifications}</span>
							</Link>
						)}
						{openDisputesCount > 0 && (
							<Link
								href="/dashboard/admin/disputes"
								className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-2xl border border-red-200 dark:border-red-900/50 transition-colors group"
							>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-xl group-hover:scale-110 transition-transform">
										<AlertTriangle className="w-5 h-5" />
									</div>
									<div className="font-bold text-red-900 dark:text-red-100">نزاعات مفتوحة</div>
								</div>
								<span className="text-lg font-black text-red-600 animate-pulse">{openDisputesCount}</span>
							</Link>
						)}
						{pendingPayoutsCount > 0 && (
							<Link
								href="/dashboard/admin/financials?tab=payouts"
								className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-2xl border border-orange-200 dark:border-orange-900/50 transition-colors group"
							>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 rounded-xl group-hover:scale-110 transition-transform">
										<Wallet className="w-5 h-5" />
									</div>
									<div className="font-bold text-orange-900 dark:text-orange-100">تسويات عالقة</div>
								</div>
								<span className="text-lg font-black text-orange-600">{pendingPayoutsCount}</span>
							</Link>
						)}
						{pendingEscrowsCount > 0 && (
							<Link
								href="/dashboard/admin/financials?tab=escrow"
								className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-2xl border border-blue-200 dark:border-blue-900/50 transition-colors group"
							>
								<div className="flex items-center gap-3">
									<div className="p-2 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-xl group-hover:scale-110 transition-transform">
										<ShieldAlert className="w-5 h-5" />
									</div>
									<div className="font-bold text-blue-900 dark:text-blue-100">أموال مجمدة</div>
								</div>
								<span className="text-lg font-black text-blue-600">{pendingEscrowsCount}</span>
							</Link>
						)}
					</div>
				)}
			</section>

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
