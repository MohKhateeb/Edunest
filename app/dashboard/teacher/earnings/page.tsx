import { UserType } from "@prisma/client";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	FileText,
	History,
	Landmark,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { calculateEarnings } from "@/lib/utils/financial";

export const metadata = {
	title: "الأرباح والتسويات | EduNest",
};

export default async function TeacherEarningsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { userId } = await requireAuth([UserType.TEACHER]);
	const resolvedParams = await searchParams;
	const currentTab = (resolvedParams.tab as string) || "overview";

	const teacher = await prisma.teacher.findUnique({
		where: { userId },
		include: { user: true },
	});

	if (!teacher) {
		return <div>حدث خطأ، لا يوجد ملف معلم.</div>;
	}

	// 1. Calculate Payouts
	const payouts = await prisma.teacherPayout.findMany({
		where: { teacherId: teacher.id },
		orderBy: { createdAt: "desc" },
	});

	const totalPaid = payouts
		.filter((p) => p.isPaid)
		.reduce((acc, curr) => acc + Number(curr.netAmount), 0);
	const totalPendingPayouts = payouts
		.filter((p) => !p.isPaid)
		.reduce((acc, curr) => acc + Number(curr.netAmount), 0);

	// 2. Calculate Unpayout Bookings
	const twentyFourHoursAgo = new Date();
	twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

	const rawBookings = await prisma.booking.findMany({
		where: {
			teacherService: { teacherId: teacher.id },
			status: "COMPLETED",
			OR: [{ paymentStatus: { in: ["PAID", "REFUNDED"] } }, { isTrial: true }],
		},
		include: {
			dispute: true,
			student: true,
			teacherService: { include: { serviceType: true } },
		},
		orderBy: { completedAt: "desc" },
		take: 100, // Limit to 100 for display, can be paginated later
	});

	let availableToPayout = 0;
	let heldAmount = 0;

	rawBookings.forEach((b) => {
		if (b.payoutId !== null) return;

		const earnings = calculateEarnings(
			Number(b.price),
			Number(b.appliedCommissionRate),
			b.isTrial,
			Number(b.trialCostToPlatform),
		);
		const net = earnings.teacherTotalEarnings;

		if (b.dispute && b.dispute.status !== "RESOLVED_IN_FAVOR_OF_TEACHER") {
			if (b.dispute.status === "OPEN") heldAmount += net;
			return;
		}

		if (b.completedAt && b.completedAt > twentyFourHoursAgo) {
			heldAmount += net;
		} else {
			availableToPayout += net;
		}
	});

	const disputedBookings = rawBookings
		.filter((b) => b.dispute)
		.sort((a, b) => {
			if (a.dispute!.status === "OPEN" && b.dispute!.status !== "OPEN")
				return -1;
			if (b.dispute!.status === "OPEN" && a.dispute!.status !== "OPEN")
				return 1;
			return (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0);
		});

	const normalBookings = rawBookings
		.filter((b) => !b.dispute)
		.sort((a, b) => {
			return (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0);
		});

	// Tab Navigation items
	const tabs = [
		{ id: "overview", label: "نظرة عامة", icon: Wallet },
		{ id: "history", label: "سجل الجلسات", icon: History },
		{ id: "payouts", label: "التسويات المالية", icon: Landmark },
		{
			id: "disputes",
			label: "النزاعات",
			icon: AlertCircle,
			badge: disputedBookings.filter((b) => b.dispute!.status === "OPEN")
				.length,
		},
	];

	return (
		<div
			className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10"
			dir="rtl"
		>
			{/* Header & Interactive Messages */}
			<div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
				<div className="lg:w-1/2">
					<h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-2">
						<Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
						محفظتك المالية
					</h1>
					<p className="text-gray-500 dark:text-gray-400 mt-2 font-medium leading-relaxed">
						محفظتك الذكية للتحكم بأموالك. راقب الجلسات المكتملة، وتتبع مستحقاتك
						بكل بساطة وبطريقة خالية من التشتت!
					</p>
				</div>

				<div className="w-full lg:w-1/2">
					{currentTab === "overview" && (
						<InteractiveMessage
							character="hakeem"
							title={`أهلاً بك، ${teacher.user.name.split(" ")[0]}`}
							message={
								availableToPayout > 0
									? `ممتاز! لديك رصيد متاح للسحب بقيمة ${availableToPayout.toFixed(2)} شيكل. استمر في تقديم جلسات رائعة لتحقيق المزيد!`
									: "مرحباً بك في محفظتك. لا يوجد رصيد متاح للسحب حالياً، لكن كل جلسة تقدمها تقربك من أهدافك المالية!"
							}
						/>
					)}
					{currentTab === "disputes" && (
						<InteractiveMessage
							character="najeeb"
							title="مرحباً!"
							message="هنا نعرض الجلسات التي تم فتح نزاع حولها. المبالغ المعلقة يتم الاحتفاظ بها بأمان حتى تتم المراجعة الدقيقة من قبل فريق الإدارة لضمان حق الجميع."
							najeebMode="help"
						/>
					)}
					{currentTab === "payouts" && (
						<InteractiveMessage
							character="hakeem"
							title="سجل شفاف"
							message="هنا يظهر تاريخ كافة التسويات والتحويلات البنكية التي تمت إلى حسابك. الشفافية أساس عملنا!"
						/>
					)}
				</div>
			</div>

			{/* Modern Tabs Navigation */}
			<div className="flex overflow-x-auto hide-scrollbar gap-2 p-1.5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50 w-full md:w-fit">
				{tabs.map((tab) => {
					const isActive = currentTab === tab.id;
					const Icon = tab.icon;
					return (
						<Link
							key={tab.id}
							href={`/dashboard/teacher/earnings?tab=${tab.id}`}
							className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${
								isActive
									? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50"
							}`}
						>
							<Icon
								className={`w-4 h-4 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
							/>
							{tab.label}
							{tab.badge !== undefined && tab.badge > 0 && (
								<span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-black ml-1 border border-red-200 dark:border-red-800/50">
									{tab.badge}
								</span>
							)}
						</Link>
					);
				})}
			</div>

			{/* TAB CONTENT: Overview */}
			{currentTab === "overview" && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
					{/* Total Paid Card */}
					<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-gray-100/50 dark:border-gray-700/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
						<div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
							<Landmark className="w-24 h-24 text-indigo-600" />
						</div>
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
								<Landmark className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
							</div>
							<p className="text-sm font-bold text-gray-500 dark:text-gray-400">
								إجمالي الأرباح المستلمة
							</p>
						</div>
						<h3 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-baseline gap-1">
							{totalPaid.toFixed(2)}
							<span className="text-lg font-medium text-gray-400">شيكل</span>
						</h3>
					</div>

					{/* Available Card */}
					<div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-[0_8px_30px_rgb(16,185,129,0.2)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
						<div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
						<div className="relative z-10">
							<div className="flex items-center gap-3 mb-4">
								<div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20">
									<Wallet className="w-6 h-6 text-emerald-50" />
								</div>
								<p className="text-sm font-bold text-emerald-50">
									الرصيد المتاح للتسوية
								</p>
							</div>
							<h3 className="text-4xl font-extrabold flex items-baseline gap-1">
								{availableToPayout.toFixed(2)}
								<span className="text-lg font-medium text-emerald-100/80">
									شيكل
								</span>
							</h3>
						</div>
					</div>

					{/* Held Amount Card */}
					<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-amber-200 dark:border-amber-900/30 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
						<div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
							<Clock className="w-24 h-24 text-amber-600" />
						</div>
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
								<Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
							</div>
							<p className="text-sm font-bold text-gray-500 dark:text-gray-400">
								رصيد معلق أو قيد التحويل
							</p>
						</div>
						<h3 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-baseline gap-1">
							{(heldAmount + totalPendingPayouts).toFixed(2)}
							<span className="text-lg font-medium text-gray-400">شيكل</span>
						</h3>
						<p className="text-[10px] text-amber-600 dark:text-amber-400 mt-3 font-medium bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/50 flex items-start gap-1.5">
							<AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
							مبالغ تحت فترة الـ 24 ساعة، أو عليها نزاع، أو قيد التحويل البنكي.
						</p>
					</div>
				</div>
			)}

			{/* TAB CONTENT: History */}
			{currentTab === "history" && (
				<div className="animate-in fade-in duration-300 space-y-4">
					<div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
						<h2 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
							<History className="w-5 h-5 text-blue-500" />
							بطاقات الجلسات السابقة (أحدث 100)
						</h2>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
						{normalBookings.length === 0 ? (
							<div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
								لا توجد جلسات مكتملة حتى الآن.
							</div>
						) : (
							normalBookings.map((booking) => {
								const price = Number(booking.price);
								const commission =
									(price * Number(booking.appliedCommissionRate)) / 100;
								const net = booking.isTrial
									? Number(booking.trialCostToPlatform)
									: price - commission;
								const isUnder24h = booking.completedAt
									? booking.completedAt > twentyFourHoursAgo
									: false;

								return (
									<div
										key={booking.id}
										className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
									>
										<div className="flex justify-between items-start">
											<div>
												<h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
													{booking.teacherService.serviceType.name}
												</h3>
												<p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
													<span className="w-4 h-4 bg-blue-50 text-blue-600 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-[9px] font-bold">
														ط
													</span>
													{booking.student.name}
												</p>
											</div>
											<div className="text-left shrink-0">
												<span className="font-black text-xl text-gray-900 dark:text-white">
													{net.toFixed(2)}
												</span>
												<span className="text-[10px] text-gray-500 mr-1">
													شيكل
												</span>
												{booking.isTrial && (
													<div className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded mt-0.5 font-medium text-center">
														تجريبية
													</div>
												)}
											</div>
										</div>

										<div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3">
											<div className="flex flex-col gap-1.5">
												<span className="text-[11px] font-mono text-gray-400">
													{booking.completedAt?.toLocaleDateString("ar-SA")}
												</span>
												<Link
													href={`/dashboard/teacher/bookings/${booking.id}`}
													className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
												>
													عرض الجلسة &larr;
												</Link>
											</div>
											<div>
												{booking.payoutId ? (
													<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-[10px] font-bold">
														<CheckCircle2 className="w-3 h-3 text-emerald-500" />{" "}
														تم تسويتها
													</span>
												) : isUnder24h ? (
													<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 text-[10px] font-bold">
														<Clock className="w-3 h-3" /> محتجز (24 س)
													</span>
												) : (
													<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 text-[10px] font-bold">
														<Wallet className="w-3 h-3" /> متاح للسحب
													</span>
												)}
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			)}

			{/* TAB CONTENT: Payouts */}
			{currentTab === "payouts" && (
				<div className="animate-in fade-in duration-300 space-y-4">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 gap-4">
						<h2 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
							<Landmark className="w-5 h-5 text-emerald-500" />
							سجل التحويلات البنكية والتسويات
						</h2>
						<form className="flex items-center gap-2 w-full sm:w-auto">
							<select
								name="status"
								defaultValue={(resolvedParams.status as string) || ""}
								className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 flex-1"
							>
								<option value="">جميع الحالات</option>
								<option value="PAID">مدفوعة</option>
								<option value="PENDING">قيد التحويل</option>
							</select>
							<input type="hidden" name="tab" value="payouts" />
							<button
								type="submit"
								className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shrink-0"
							>
								تصفية
							</button>
						</form>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{payouts.length === 0 ? (
							<div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
								لا توجد تسويات مالية سابقة.
							</div>
						) : (
							(resolvedParams.status
								? payouts.filter((p) =>
										resolvedParams.status === "PAID" ? p.isPaid : !p.isPaid,
									)
								: payouts
							).map((payout) => (
								<div
									key={payout.id}
									className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col gap-4"
								>
									<div className="flex justify-between items-center">
										<span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-600">
											#{payout.id.slice(0, 8)}
										</span>
										{payout.isPaid ? (
											<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
												<CheckCircle2 className="w-3 h-3" /> تم التحويل
											</span>
										) : (
											<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
												<span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>{" "}
												قيد التحويل البنكي
											</span>
										)}
									</div>
									<div>
										<span className="font-extrabold text-3xl text-gray-900 dark:text-white">
											{Number(payout.netAmount).toFixed(2)}
										</span>
										<span className="text-sm text-gray-500 mr-1 font-bold">
											شيكل
										</span>
									</div>
									<div className="border-t border-gray-100 dark:border-gray-700 pt-3 text-xs text-gray-500 flex justify-between items-center">
										<span className="font-mono">
											{payout.createdAt.toLocaleDateString("ar-SA")}
										</span>
										<span className="flex gap-1.5 items-center bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded-md font-mono">
											{payout.periodStart.toLocaleDateString("ar-SA")}{" "}
											<ArrowLeft className="w-3 h-3 text-gray-300" />{" "}
											{payout.periodEnd.toLocaleDateString("ar-SA")}
										</span>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			)}

			{/* TAB CONTENT: Disputes */}
			{currentTab === "disputes" && (
				<div className="animate-in fade-in duration-300 space-y-4">
					<div className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
						<h2 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
							<AlertCircle className="w-5 h-5" />
							النزاعات النشطة والمغلقة
						</h2>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						{disputedBookings.length === 0 ? (
							<div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-2">
								<CheckCircle2 className="w-8 h-8 text-emerald-500" />
								<span className="font-bold">
									لا توجد أي نزاعات مالية. أداؤك ممتاز!
								</span>
							</div>
						) : (
							disputedBookings.map((booking) => {
								const price = Number(booking.price);
								const commission =
									(price * Number(booking.appliedCommissionRate)) / 100;
								const net = booking.isTrial
									? Number(booking.trialCostToPlatform)
									: price - commission;

								return (
									<div
										key={booking.id}
										className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden group"
									>
										<div className="absolute top-0 right-0 w-1 h-full bg-red-400 dark:bg-red-600"></div>
										<div className="flex justify-between items-start pr-3">
											<div>
												<h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
													{booking.teacherService.serviceType.name}
												</h3>
												<p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
													<span className="w-4 h-4 bg-red-50 text-red-600 dark:bg-red-900/30 rounded-full flex items-center justify-center text-[9px] font-bold">
														ط
													</span>
													{booking.student.name}
												</p>
											</div>
											<div className="text-left shrink-0">
												<span className="font-black text-xl text-gray-900 dark:text-white">
													{net.toFixed(2)}
												</span>
												<span className="text-[10px] text-gray-500 mr-1">
													شيكل
												</span>
											</div>
										</div>

										<div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3 mt-1 pr-3">
											<span
												className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
													booking.dispute!.status === "OPEN"
														? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 ring-1 ring-amber-200"
														: booking.dispute!.status ===
																"RESOLVED_IN_FAVOR_OF_TEACHER"
															? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 ring-1 ring-emerald-200"
															: "bg-red-100 text-red-800 dark:bg-red-900/30 ring-1 ring-red-200"
												}`}
											>
												{booking.dispute!.status === "OPEN" ? (
													<>
														<span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>{" "}
														قيد المراجعة
													</>
												) : booking.dispute!.status ===
													"RESOLVED_IN_FAVOR_OF_TEACHER" ? (
													<>
														<CheckCircle2 className="w-3 h-3" /> حُسم لصالحك
													</>
												) : (
													<>
														<AlertCircle className="w-3 h-3" /> حُسم لولي الأمر
													</>
												)}
											</span>

											<div className="flex items-center gap-2">
												<Link
													href={`/dashboard/teacher/bookings/${booking.id}`}
													className="text-[10px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:underline transition-all"
												>
													تفاصيل الجلسة
												</Link>
												<Link
													href={`/dashboard/disputes/${booking.dispute!.id}`}
													className="text-[10px] font-bold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-blue-600 dark:hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-all shadow-sm"
												>
													المحادثة
												</Link>
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			)}
		</div>
	);
}
