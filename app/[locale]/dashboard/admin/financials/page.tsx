import { UserType } from "@prisma/client";
import { Activity, Banknote, CheckCircle2, Landmark, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { requireAuth } from "@/lib/require-auth";
import {
	getAdminFinancialStats,
	getAdminOpenDisputes,
	getPlatformRevenueDetails,
	getAdminPayoutsData,
} from "@/lib/services/domain/financial-service";
import { getAllEscrows } from "@/lib/services/domain/admin-escrow-service";
import DateFilter from "./_components/DateFilter";
import FinancialTabs from "./_components/FinancialTabs";
import AdminPayoutsEngine from "@/app/dashboard/admin/payouts/_components/AdminPayoutsEngine";
import { EscrowActions } from "@/app/dashboard/admin/escrow/escrow-actions";
import { formatPrice } from "@/lib/utils";

export const metadata = {
	title: "الإدارة المالية الشاملة | EduNest",
};

export default async function AdminFinancialsPage({
	searchParams,
}: {
	searchParams: Promise<{ tab?: string; from?: string; to?: string; cursor?: string }>;
}) {
	await requireAuth([UserType.ADMIN]);

	const resolvedSearchParams = await searchParams;
	const currentTab = resolvedSearchParams.tab || "overview";
	const from = resolvedSearchParams.from;
	const to = resolvedSearchParams.to;

	// Global Stats
	const { totalRevenue, totalCommission } = await getAdminFinancialStats(from, to);

	// Fetch required data based on active tab to optimize load
	let content = null;

	if (currentTab === "overview") {
		const openDisputes = await getAdminOpenDisputes();
		
		content = (
			<div className="space-y-8 animate-in fade-in duration-500">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-border group hover:-translate-y-1 transition-all">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
								<Banknote className="w-6 h-6 text-blue-600 dark:text-blue-400" />
							</div>
							<p className="text-sm font-bold text-muted-foreground">
								إجمالي التداول (Gross)
							</p>
						</div>
						<h3 className="text-4xl font-extrabold flex items-baseline gap-1">
							{totalRevenue.toFixed(2)}
							<span className="text-lg text-muted-foreground font-medium">شيكل</span>
						</h3>
					</div>

					<div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-md text-white group hover:-translate-y-1 transition-all">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
								<Landmark className="w-6 h-6 text-emerald-50" />
							</div>
							<p className="text-sm font-bold text-emerald-50">
								أرباح المنصة الصافية
							</p>
						</div>
						<h3 className="text-4xl font-extrabold flex items-baseline gap-1">
							{totalCommission.toFixed(2)}
							<span className="text-lg text-emerald-100/80 font-medium">شيكل</span>
						</h3>
					</div>
				</div>

				{openDisputes.length > 0 && (
					<section className="bg-white dark:bg-card border-2 border-red-100 dark:border-red-900/30 rounded-3xl p-6">
						<h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-red-700 dark:text-red-400">
							<ShieldAlert className="w-6 h-6" />
							أحدث النزاعات المفتوحة
						</h2>
						<div className="grid gap-4 md:grid-cols-2">
							{openDisputes.map(d => (
								<div key={d.id} className="border border-border p-4 rounded-xl">
									<h4 className="font-bold">ولي الأمر: {d.booking.parent.name}</h4>
									<p className="text-sm text-muted-foreground mt-2 line-clamp-2">{d.reason}</p>
									<Link href={`/dashboard/admin/disputes/${d.id}`} className="text-primary text-sm font-bold mt-2 inline-block">
										عرض النزاع
									</Link>
								</div>
							))}
						</div>
					</section>
				)}
			</div>
		);
	} else if (currentTab === "revenue") {
		const revenueDetails = await getPlatformRevenueDetails(from, to);
		
		content = (
			<div className="space-y-6 animate-in fade-in duration-500">
				<div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-900/50 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
					<div>
						<h2 className="text-2xl font-black text-emerald-800 dark:text-emerald-400">تفاصيل أرباح المنصة</h2>
						<p className="text-emerald-600 dark:text-emerald-500 font-medium">إجمالي الأرباح للفترة المحددة: {totalCommission.toFixed(2)} شيكل</p>
					</div>
					<div className="p-4 bg-white dark:bg-card rounded-2xl shadow-sm font-mono text-xl font-bold text-emerald-700">
						{revenueDetails.length} عملية
					</div>
				</div>

				{revenueDetails.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground bg-card border-2 border-dashed border-border rounded-3xl">
						<p className="font-bold">لا توجد عمليات ربحية في هذه الفترة.</p>
					</div>
				) : (
					<div className="bg-white dark:bg-card border border-border rounded-3xl overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full text-right">
								<thead className="bg-muted/50 text-muted-foreground">
									<tr>
										<th className="p-4 font-bold">التاريخ</th>
										<th className="p-4 font-bold">النوع</th>
										<th className="p-4 font-bold">المبلغ</th>
										<th className="p-4 font-bold">الوصف</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{revenueDetails.map(t => (
										<tr key={t.id} className="hover:bg-muted/30 transition-colors">
											<td className="p-4 font-mono text-sm">{t.date.toLocaleDateString("ar-SA")}</td>
											<td className="p-4">
												<span className={`text-xs px-2 py-1 rounded-md font-bold ${t.type === "COMMISSION" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
													{t.type === "COMMISSION" ? "عمولة منصة" : "رصيد مصادر"}
												</span>
											</td>
											<td className="p-4 font-black text-emerald-600">+{t.amount.toFixed(2)} ₪</td>
											<td className="p-4 text-sm">{t.description}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		);
	} else if (currentTab === "payouts") {
		const { teacherGroups, mappedPayouts, mappedRefunds } = await getAdminPayoutsData(from, to);
		
		content = (
			<div className="animate-in fade-in duration-500">
				<AdminPayoutsEngine
					teacherGroups={teacherGroups}
					existingPayouts={mappedPayouts}
					parentRefunds={mappedRefunds}
				/>
			</div>
		);
	} else if (currentTab === "escrow") {
		const cursor = resolvedSearchParams.cursor;
		const { items: escrows, nextCursor } = await getAllEscrows(from, to, { cursor });
		// TODO: wire up pagination UI
		const pendingEscrows = escrows.filter((e) => e.status === "PENDING");
		const resolvedEscrows = escrows.filter((e) => e.status !== "PENDING");

		content = (
			<div className="space-y-6 animate-in fade-in duration-500">
				{pendingEscrows.length === 0 && resolvedEscrows.length === 0 ? (
					<div className="bg-card border-2 border-dashed border-border rounded-3xl p-12 text-center text-muted-foreground">
						<CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4 opacity-50" />
						<p className="font-bold">الصندوق فارغ حالياً. لم يتم تجميد أو مصادرة أي جلسات.</p>
					</div>
				) : (
					<div className="grid gap-6">
						{pendingEscrows.length > 0 && (
							<div className="space-y-4">
								<h2 className="text-lg font-bold flex items-center gap-2 text-red-600">
									<ShieldAlert className="h-5 w-5" />
									بانتظار القرار الإداري ({pendingEscrows.length})
								</h2>
								<div className="grid gap-4">
									{pendingEscrows.map((escrow) => (
										<div
											key={escrow.id}
											className="bg-white dark:bg-card border-2 border-red-200 dark:border-red-900/50 rounded-3xl p-5 shadow-sm"
										>
											<div className="flex flex-col md:flex-row gap-4 justify-between">
												<div>
													<div className="flex items-center gap-3 mb-2">
														<span className="font-bold text-lg text-red-600">
															{formatPrice(Number(escrow.amount))}
														</span>
														<span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 px-2 py-1 rounded-md font-bold">
															رصيد مجمد
														</span>
													</div>
													<div className="text-sm text-foreground space-y-1">
														<p><strong>المعلم:</strong> {escrow.booking.teacherService.teacher.user.name}</p>
														<p><strong>الطالب:</strong> {escrow.booking.student.name}</p>
														<p><strong>تاريخ الجلسة:</strong> {escrow.booking.startTime.toLocaleDateString("ar-SA")}</p>
													</div>
													<p className="mt-3 text-sm text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
														<strong>السبب:</strong> {escrow.reason}
													</p>
												</div>
												<div className="flex-shrink-0 flex items-center md:items-start">
													<EscrowActions
														escrowId={escrow.id}
													/>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{resolvedEscrows.length > 0 && (
							<div className="space-y-4 mt-8">
								<h2 className="text-lg font-bold flex items-center gap-2 text-muted-foreground">
									<CheckCircle2 className="h-5 w-5" />
									سجل القرارات السابقة ({resolvedEscrows.length})
								</h2>
								<div className="grid gap-3 opacity-75">
									{resolvedEscrows.map((escrow) => (
										<div key={escrow.id} className="bg-muted/30 border border-border rounded-2xl p-4 flex justify-between items-center">
											<div>
												<span className="font-bold text-sm">المعلم: {escrow.booking.teacherService.teacher.user.name}</span>
												<p className="text-xs text-muted-foreground mt-1">المبلغ: {formatPrice(Number(escrow.amount))}</p>
											</div>
											<div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-background border border-border">
												{escrow.status === "REFUNDED_TO_PARENT" && "تم استرداد المبلغ لولي الأمر"}
												{escrow.status === "PAID_TO_TEACHER" && "تم دفع المبلغ للمعلم"}
												{escrow.status === "PLATFORM_PROFIT" && "تمت المصادرة كأرباح للمنصة"}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10" dir="rtl">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
				<div>
					<h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-2 mb-2">
						<Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
						المركز المالي الشامل
					</h1>
					<p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
						مراقبة إيرادات المنصة، المهام المالية، تسويات المعلمين، والأموال المجمدة بلمحة بصر.
					</p>
				</div>
				<DateFilter />
			</div>

			<FinancialTabs />

			<div className="min-h-[400px]">
				{content}
			</div>
		</div>
	);
}
