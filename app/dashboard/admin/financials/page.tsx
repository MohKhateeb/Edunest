import { UserType } from "@prisma/client";
import {
	Activity,
	Banknote,
	CheckCircle2,
	ChevronLeft,
	CreditCard,
	Landmark,
	ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { getAdminFinancialStats } from "@/lib/services/admin-financial-service";

export const metadata = {
	title: "الإدارة المالية الشاملة | EduNest",
};

export default async function AdminFinancialsPage() {
	await requireAuth([UserType.ADMIN]);

	const {
		openDisputesCount,
		pendingPayoutsCount,
		totalRevenue,
		totalCommission,
	} = await getAdminFinancialStats();

	// Fetch Open Disputes
	const openDisputes = await prisma.dispute.findMany({
		where: { status: "OPEN" },
		include: {
			booking: {
				include: {
					teacherService: { include: { teacher: { include: { user: true } } } },
					student: true,
					parent: true,
				},
			},
		},
		orderBy: { createdAt: "asc" },
		take: 5,
	});

	// Fetch Pending Payouts
	const pendingPayouts = await prisma.teacherPayout.findMany({
		where: { isPaid: false },
		include: { teacher: { include: { user: true } } },
		orderBy: { createdAt: "asc" },
		take: 5,
	});

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-2">
						<Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
						مركز الإدارة المالية
					</h1>
					<p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
						مراقبة الإيرادات، المهام المالية، وتسويات المعلمين بلمحة بصر.
					</p>
				</div>
			</div>

			{/* Action Items (To-Dos) */}
			{(openDisputesCount > 0 || pendingPayoutsCount > 0) && (
				<div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-2xl p-5 shadow-sm">
					<h3 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2 mb-3">
						<svg
							className="w-5 h-5"
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
						مهام تتطلب الإجراء
					</h3>
					<ul className="space-y-2">
						{openDisputesCount > 0 && (
							<li className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-red-100 dark:border-gray-700">
								<span className="text-gray-700 dark:text-gray-300">
									يوجد{" "}
									<strong className="text-red-600">{openDisputesCount}</strong>{" "}
									اعتراضات مفتوحة بانتظار قرار الإدارة.
								</span>
								<Link
									href="/dashboard/admin/disputes"
									className="text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-1.5 rounded-lg hover:bg-red-200 transition-colors"
								>
									إدارة جميع النزاعات
								</Link>
							</li>
						)}
						{pendingPayoutsCount > 0 && (
							<li className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl border border-orange-100 dark:border-gray-700">
								<span className="text-gray-700 dark:text-gray-300">
									يوجد{" "}
									<strong className="text-orange-600">
										{pendingPayoutsCount}
									</strong>{" "}
									تسويات مالية بانتظار التحويل البنكي للمعلمين.
								</span>
								<a
									href="#payouts"
									className="text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-4 py-1.5 rounded-lg hover:bg-orange-200 transition-colors"
								>
									مراجعة التسويات
								</a>
							</li>
						)}
					</ul>
				</div>
			)}

			{/* Global Stats */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-gray-100/50 dark:border-gray-700/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
					<div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
						<Banknote className="w-24 h-24 text-blue-600" />
					</div>
					<div className="flex items-center gap-3 mb-4">
						<div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
							<Banknote className="w-6 h-6 text-blue-600 dark:text-blue-400" />
						</div>
						<p className="text-sm font-bold text-gray-500 dark:text-gray-400">
							إجمالي التداول (Gross)
						</p>
					</div>
					<h3 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-baseline gap-1">
						{totalRevenue.toFixed(2)}
						<span className="text-lg text-gray-400 font-medium">شيكل</span>
					</h3>
				</div>

				<div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-[0_8px_30px_rgb(16,185,129,0.2)] text-white relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
					<div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
					<div className="relative z-10">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20">
								<Landmark className="w-6 h-6 text-emerald-50" />
							</div>
							<p className="text-sm font-bold text-emerald-50">
								أرباح المنصة (العمولة)
							</p>
						</div>
						<h3 className="text-4xl font-extrabold flex items-baseline gap-1">
							{totalCommission.toFixed(2)}
							<span className="text-lg text-emerald-100/80 font-medium">
								شيكل
							</span>
						</h3>
					</div>
				</div>
			</div>

			<div className="grid lg:grid-cols-2 gap-8">
				{/* Disputes Section */}
				<section
					id="disputes"
					className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-sm border border-gray-100/50 dark:border-gray-700/50 overflow-hidden flex flex-col group"
				>
					<div className="p-6 border-b border-gray-100/50 dark:border-gray-700/50 bg-gradient-to-l from-red-50/50 to-transparent dark:from-red-900/10 flex justify-between items-center">
						<h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
							<div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
								<ShieldAlert className="w-5 h-5" />
							</div>
							نزاعات قيد المراجعة
						</h2>
						<span className="text-sm text-gray-500 font-medium">
							أقدم 5 نزاعات
						</span>
					</div>
					<div className="p-5 flex-1">
						{openDisputes.length === 0 ? (
							<div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
								<div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
									<CheckCircle2 className="w-8 h-8" />
								</div>
								<p className="font-bold">لا توجد نزاعات مفتوحة حالياً!</p>
								<p className="text-sm opacity-80 mt-1">
									عمل رائع، المنصة خالية من المشاكل.
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{openDisputes.map((dispute) => (
									<div
										key={dispute.id}
										className="border border-red-100 dark:border-red-900/30 bg-white dark:bg-gray-800 rounded-2xl p-4 hover:shadow-md transition-shadow relative overflow-hidden"
									>
										<div className="absolute top-0 right-0 w-1 h-full bg-red-400"></div>
										<div className="flex justify-between items-start mb-2">
											<h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
												<span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
												ولي الأمر: {dispute.booking.parent.name}
											</h4>
											<span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
												{dispute.createdAt.toLocaleDateString("ar-SA")}
											</span>
										</div>
										<p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50 leading-relaxed">
											{dispute.reason}
										</p>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
												<span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
													م
												</span>
												{dispute.booking.teacherService.teacher.user.name}
											</div>
											<Link
												href={`/dashboard/disputes/${dispute.id}`}
												className="text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1 transition-all"
											>
												مراجعة وبت
												<ChevronLeft className="w-3 h-3" />
											</Link>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</section>

				{/* Payouts Section */}
				<section
					id="payouts"
					className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-sm border border-gray-100/50 dark:border-gray-700/50 overflow-hidden flex flex-col group"
				>
					<div className="p-6 border-b border-gray-100/50 dark:border-gray-700/50 bg-gradient-to-l from-orange-50/50 to-transparent dark:from-orange-900/10 flex justify-between items-center">
						<h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
							<div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
								<CreditCard className="w-5 h-5" />
							</div>
							تسويات بانتظار الدفع
						</h2>
						<Link
							href="/dashboard/admin/payouts"
							className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
						>
							إدارة الكل
							<ChevronLeft className="w-4 h-4" />
						</Link>
					</div>
					<div className="p-5 flex-1">
						{pendingPayouts.length === 0 ? (
							<div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
								<div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
									<CheckCircle2 className="w-8 h-8" />
								</div>
								<p className="font-bold">جميع مستحقات المعلمين مدفوعة.</p>
								<p className="text-sm opacity-80 mt-1">
									لا توجد تسويات معلقة حالياً.
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{pendingPayouts.map((payout) => (
									<div
										key={payout.id}
										className="border border-orange-100 dark:border-orange-900/30 bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden"
									>
										<div className="absolute top-0 right-0 w-1 h-full bg-orange-400"></div>
										<div>
											<h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
												<span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">
													💰
												</span>
												{payout.teacher.user.name}
											</h4>
											<p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
												<span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
													{payout.periodStart.toLocaleDateString("ar-SA")}
												</span>
												<span>إلى</span>
												<span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
													{payout.periodEnd.toLocaleDateString("ar-SA")}
												</span>
											</p>
										</div>
										<div className="text-left flex flex-col items-end">
											<div className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
												{Number(payout.netAmount).toFixed(2)}{" "}
												<span className="text-xs text-gray-500 font-normal">
													شيكل
												</span>
											</div>
											<Link
												href="/dashboard/admin/payouts"
												className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-600 hover:text-white font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
											>
												تحويل وتسديد
												<ChevronLeft className="w-3 h-3" />
											</Link>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
