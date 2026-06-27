import { BookingStatus, UserType } from "@prisma/client";
import {
	AlertCircle,
	BadgeCheck,
	Calendar,
	Clock,
	DollarSign,
	Star,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import BookingCard from "@/components/shared/BookingCard";
import TeacherEarningsChart from "@/components/shared/charts/TeacherEarningsChart";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import TeacherOnlineToggle from "@/components/shared/TeacherOnlineToggle";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { type DetailedBooking } from "@/lib/types";
import { formatPrice, sanitizePrismaData } from "@/lib/utils";
import { getTeacherDashboardOverview } from "@/lib/services/domain/analytics-service";

export default async function TeacherDashboard() {
	await requireAuth([UserType.TEACHER]);
	const session = await auth();
	await requireAuth([UserType.TEACHER]);

	if (!session) return null;

	const dashboardData = await getTeacherDashboardOverview(session.user.id);

	if (!dashboardData) {
		return (
			<div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto space-y-4">
				<AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
				<h2 className="text-xl font-bold">حساب غير مكتمل</h2>
				<p className="text-muted-foreground text-sm">
					يبدو أن ملفك كمعلم غير مكتمل بعد. يرجى إكمال إعداد ملفك الشخصي
					لتتمكن من الوصول إلى لوحة القيادة واستقبال طلبات الحجز.
				</p>
				<Link
					href="/dashboard/teacher/profile"
					className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
				>
					أكمل ملفك الشخصي
				</Link>
			</div>
		);
	}

	const {
		teacher,
		upcomingCount,
		pendingRequests,
		pendingEarnings,
		totalEarnings,
		chartData,
		nextSession,
		liveSession,
		openDisputes,
		urgentAlerts,
	} = dashboardData;

	const sanitizedPendingRequests = sanitizePrismaData(pendingRequests);
	const sanitizedNextSession = sanitizePrismaData(nextSession);
	const sanitizedLiveSession = liveSession
		? sanitizePrismaData(liveSession)
		: null;

	return (
		<div className="space-y-8 text-right pb-10" dir="rtl">
			{/* Welcome header */}
			<div className="mt-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
				<InteractiveMessage
					character="najeeb"
					title={`أهلاً بك، أ. ${session.user.name} 👋`}
					message="من لوحة التحكم يمكنك قبول حجوزات الطلاب، إدارة أوقات فراغك، ومتابعة أرباحك بسلاسة."
					najeebMode="welcome"
					className="lg:w-1/2"
				/>
				<div className="flex flex-col gap-3 shrink-0">
					<TeacherOnlineToggle initialStatus={teacher.isAvailableNow} />

					<div className="text-left bg-gradient-to-l from-primary to-blue-400 px-6 py-4 rounded-2xl shadow-md text-white animate-pulse-soft">
						<span className="text-xs text-white/80 block mb-1">
							رابط صفحتك العامة للطلاب
						</span>
						<Link
							href={`/teachers/${teacher.slug}`}
							className="text-sm font-black hover:underline flex items-center gap-1"
						>
							<span>edunest.com/teachers/{teacher.slug}</span>
						</Link>
					</div>
				</div>
			</div>

			{/* Urgent Matters Section */}
			{(openDisputes.length > 0 || !teacher.isVerified || urgentAlerts.length > 0) && (
				<div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-3xl p-6 shadow-sm">
					<h2 className="font-black text-lg text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
						<AlertCircle className="h-6 w-6" />
						تنبيهات هامة بحاجة لإجراء
					</h2>
					<div className="space-y-3">
						{!teacher.isVerified && (
							<div className="flex items-center justify-between bg-white dark:bg-card p-4 rounded-2xl border border-red-100 dark:border-red-900/50">
								<div>
									<h3 className="font-bold text-sm text-foreground">
										ملفك الشخصي غير موثق بعد
									</h3>
									<p className="text-xs text-muted-foreground mt-1">
										لا يمكنك استقبال حجوزات جديدة أو الظهور في نتائج البحث
										حتى يتم توثيق ملفك.
									</p>
								</div>
								<Link
									href="/dashboard/teacher/profile"
									className="text-xs font-bold text-primary hover:underline whitespace-nowrap mr-4"
								>
									إكمال الملف
								</Link>
							</div>
						)}
						{openDisputes.map((dispute) => (
							<div
								key={dispute.id}
								className="flex items-center justify-between bg-white dark:bg-card p-4 rounded-2xl border border-red-100 dark:border-red-900/50"
							>
								<div>
									<h3 className="font-bold text-sm text-foreground">
										نزاع مفتوح: جلسة {dispute.booking.student.name}
									</h3>
									<p className="text-xs text-muted-foreground mt-1">
										قام ولي الأمر بفتح نزاع حول الجلسة. يرجى الرد والتواصل
										مع الإدارة.
									</p>
								</div>
								<Link
									href={`/dashboard/disputes/${dispute.id}`}
									className="text-xs font-bold text-primary hover:underline whitespace-nowrap mr-4"
								>
									عرض النزاع والرد
								</Link>
							</div>
						))}
						{urgentAlerts.map((alert) => (
							<div
								key={alert.id}
								className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-white dark:bg-card p-4 rounded-2xl border border-orange-200 dark:border-orange-900/50"
							>
								<div>
									<h3 className={`font-bold text-sm ${alert.type === 'WARNING_2_FROZEN' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
										{alert.type === 'WARNING_2_FROZEN' ? 'تجميد رصيد - تحذير نهائي!' : 'تحذير تقرير متأخر'}
									</h3>
									<p className="text-xs text-muted-foreground mt-1 font-semibold">
										{alert.message}
									</p>
								</div>
								<Link
									href={`/dashboard/teacher/bookings/${alert.bookingId}`}
									className="shrink-0 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
								>
									الذهاب لكتابة التقرير
								</Link>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Live Session Banner */}
			{sanitizedLiveSession && (
				<div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-6 shadow-xl shadow-rose-500/20 text-white animate-in zoom-in duration-300 relative overflow-hidden border border-rose-400/30">
					<div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
					<div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
						<div>
							<div className="flex items-center gap-2 mb-2">
								<span className="relative flex h-3 w-3">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
									<span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
								</span>
								<h2 className="font-black text-xl text-white">
									الجلسة الفورية بدأت الآن!
								</h2>
							</div>
							<p className="text-white/90 text-sm font-semibold">
								تم الدفع بنجاح. الطالب {sanitizedLiveSession.student.name}{" "}
								بانتظارك في الجلسة.
							</p>
						</div>
						{sanitizedLiveSession.meetingUrl ? (
							<a
								href={sanitizedLiveSession.meetingUrl}
								target="_blank"
								rel="noreferrer"
								className="bg-white text-rose-600 hover:bg-rose-50 px-8 py-3 rounded-xl font-black shadow-lg transition-transform hover:scale-105 whitespace-nowrap text-center"
							>
								ادخل الجلسة الآن
							</a>
						) : (
							<div className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold">
								جاري تجهيز الرابط...
							</div>
						)}
					</div>
				</div>
			)}

			{/* الموجز المالي والتفاعلي للحكيم */}
			<div className="pt-2 border-t border-border/50">
				<InteractiveMessage
					character="hakeem"
					title="موجز الحكيم لإدارة حصصك"
					message={
						sanitizedPendingRequests.length > 0
							? `لديك ${sanitizedPendingRequests.length} طلب حجز بانتظار ردك! سارع بتأكيدها لزيادة موثوقيتك عند الطلاب.`
							: "أمورك ممتازة! احرص على تحديث أوقات فراغك باستمرار لاستقبال حجوزات جديدة."
					}
				/>

				{/* Grid Stats */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
					<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
						<div className="p-2 bg-primary/10 text-primary rounded-2xl mb-2">
							<DollarSign className="h-5 w-5" />
						</div>
						<span className="text-2xl font-black text-foreground mb-1">
							{formatPrice(totalEarnings)}
						</span>
						<span className="text-xs text-muted-foreground font-bold">
							إجمالي الأرباح
						</span>
					</div>

					<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
						<div className="p-2 bg-teal-50 dark:bg-teal-950/20 text-teal-600 rounded-2xl mb-2">
							<Calendar className="h-5 w-5" />
						</div>
						<span className="text-2xl font-black text-foreground mb-1">
							{teacher.totalSessions}
						</span>
						<span className="text-xs text-muted-foreground font-bold">
							حصص مكتملة
						</span>
					</div>

					<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
						<div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 rounded-2xl mb-2">
							<Star className="h-5 w-5 fill-currentColor" />
						</div>
						<span className="text-2xl font-black text-foreground mb-1">
							{Number(teacher.averageRating).toFixed(1)}
						</span>
						<span className="text-xs text-muted-foreground font-bold">
							متوسط التقييم
						</span>
					</div>

					<div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
						<div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-2xl mb-2">
							<Clock className="h-5 w-5" />
						</div>
						<span className="text-2xl font-black text-foreground mb-1">
							{upcomingCount}
						</span>
						<span className="text-xs text-muted-foreground font-bold">
							حصص قادمة
						</span>
					</div>
				</div>
			</div>

			{/* Main Grid Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Column */}
				<div className="lg:col-span-2 space-y-6">
					{/* Earnings Chart */}
					<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
						<div className="flex items-center justify-between border-b border-border pb-3 mb-4">
							<h2 className="font-black text-lg flex items-center gap-2">
								<DollarSign className="h-6 w-6 text-primary" />
								نشاطك المالي (آخر 7 أيام)
							</h2>
						</div>
						<TeacherEarningsChart data={chartData} />
					</div>

					{/* Pending Requests */}
					<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
						<h2 className="font-black text-lg flex items-center gap-2 border-b border-border pb-3">
							<Clock className="h-6 w-6 text-secondary" />
							طلبات حجز بانتظار ردك ({sanitizedPendingRequests.length})
						</h2>
						{sanitizedPendingRequests.length === 0 ? (
							<div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border">
								<p className="text-sm text-muted-foreground font-semibold">
									لا توجد طلبات حجز معلقة حالياً.
								</p>
							</div>
						) : (
							<div className="grid grid-cols-1 gap-4">
								{sanitizedPendingRequests.map((req) => (
									<BookingCard key={req.id} booking={req} role="TEACHER" />
								))}
							</div>
						)}
					</div>
				</div>

				{/* Info Sidebar */}
				<div className="space-y-6">
					{/* Next Lesson */}
					<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
						<h2 className="font-black text-lg border-b border-border pb-3 flex items-center gap-2">
							<Calendar className="h-6 w-6 text-primary" />
							الجلسة المجدولة التالية
						</h2>
						{sanitizedNextSession ? (
							<BookingCard booking={sanitizedNextSession} role="TEACHER" />
						) : (
							<div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border">
								<p className="text-sm text-muted-foreground font-semibold">
									لا توجد حصص مجدولة قادمة.
								</p>
							</div>
						)}
					</div>

					{/* Verification Status */}
					<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
						<h2 className="font-black text-lg border-b border-border pb-3 flex items-center gap-2">
							<BadgeCheck className="h-6 w-6 text-emerald-500" />
							حالة التوثيق
						</h2>
						<div className="text-sm space-y-3 font-semibold">
							<div className="flex justify-between items-center py-1">
								<span className="text-muted-foreground">موثق من الإدارة:</span>
								<span
									className={`font-black ${teacher.isVerified ? "text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg" : "text-slate-500"}`}
								>
									{teacher.isVerified ? "نعم ✓" : "لا"}
								</span>
							</div>
							<div className="flex justify-between items-center py-1">
								<span className="text-muted-foreground">مستوى التوثيق:</span>
								<span className="font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">
									{teacher.verificationLevel}
								</span>
							</div>
							{!teacher.isVerified && (
								<div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-2xl p-4 text-xs leading-relaxed border border-yellow-200 dark:border-yellow-800 mt-2">
									يرجى الانتقال لصفحة <strong>وثائق التوثيق</strong> ورفع هويتك
									والشهادة الجامعية ليتم تفعيل حسابك وعرضه في البحث.
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
