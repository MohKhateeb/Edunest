import { Prisma, UserType } from "@prisma/client";
import {
	CreditCard,
	HandCoins,
	History,
	RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import {
	DisputeAction,
	PaymentAction,
} from "@/components/shared/FinancialActions";
import { requireAuth } from "@/lib/require-auth";
import { getParentFinancials } from "@/lib/services/parent-financial-service";
import type { ParentFinancialBooking } from "@/lib/services/parent-financial-service";
import { hoursUntil } from "@/lib/utils/time";

export const metadata = {
	title: "السجل المالي | EduNest",
};

// Use the exported type from the service
type FinancialBooking = ParentFinancialBooking;

// Helper: Render Payment Status to avoid nested ternaries
const renderPaymentStatus = (booking: FinancialBooking) => {
	if (booking.paymentStatus === "PAID") {
		return (
			<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 text-xs font-bold">
				مدفوع
			</span>
		);
	}
	if (booking.paymentStatus === "REFUNDED") {
		return (
			<div className="flex flex-col gap-1">
				<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 text-xs font-bold w-fit">
					تم الاسترداد
				</span>
				{booking.parentRefund && (
					<span
						className={`text-[10px] font-bold ${booking.parentRefund.isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
					>
						{booking.parentRefund.isPaid
							? "✓ تم التحويل البنكي"
							: "⏳ قيد التحويل للإدارة"}
					</span>
				)}
			</div>
		);
	}
	if (booking.status === "PENDING") {
		return <PaymentAction bookingId={booking.id} price={Number(booking.price)} />;
	}
	return (
		<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 text-xs font-bold">
			غير مدفوع
		</span>
	);
};

// Helper: Render Dispute Action to avoid nested ternaries
const renderDisputeAction = (booking: FinancialBooking) => {
	if (booking.dispute) {
		return (
			<div className="flex flex-col gap-2 items-start">
				<span
					className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
						booking.dispute.status === "OPEN"
							? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
							: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
					}`}
				>
					{booking.dispute.status === "OPEN" ? "قيد المراجعة" : "مغلق"}
				</span>
				<Link
					href={`/dashboard/disputes/${booking.dispute.id}`}
					className="text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-all border border-blue-100 dark:border-blue-900/50"
				>
					متابعة النزاع
				</Link>
			</div>
		);
	}
	if (
		booking.status === "COMPLETED" &&
		booking.completedAt &&
		hoursUntil(booking.completedAt) >= -24 &&
		!booking.payoutId
	) {
		return <DisputeAction bookingId={booking.id} />;
	}
	return (
		<span className="text-gray-400 dark:text-gray-600 text-xs font-medium">
			لا يوجد
		</span>
	);
};

export default async function ParentFinancialsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { userId } = await requireAuth([UserType.PARENT]);
	const resolvedParams = await searchParams;

	const dateFilter = resolvedParams.date as string | undefined;
	const teacherFilter = resolvedParams.teacher as string | undefined;

	const { bookings, totalSpent, totalRefunded, teachers } =
		await getParentFinancials(userId, dateFilter, teacherFilter);

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-2">
						<History className="w-8 h-8 text-blue-600 dark:text-blue-400" />
						السجل المالي
					</h1>
					<p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
						تابع جميع مدفوعاتك، واطلع على سجلات الاسترداد والنزاعات.
					</p>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-gray-100/50 dark:border-gray-700/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
					<div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
						<CreditCard className="w-24 h-24 text-blue-600" />
					</div>
					<div className="flex items-center gap-3 mb-4">
						<div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
							<CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
						</div>
						<p className="text-sm font-bold text-gray-500 dark:text-gray-400">
							إجمالي المدفوعات
						</p>
					</div>
					<h3 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-baseline gap-1">
						{totalSpent}
						<span className="text-lg font-medium text-gray-400">شيكل</span>
					</h3>
				</div>
				<div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-[0_8px_30px_rgb(16,185,129,0.2)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
					<div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
					<div className="relative z-10">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20">
								<RefreshCcw className="w-6 h-6 text-emerald-50" />
							</div>
							<p className="text-sm font-bold text-emerald-50">
								المبالغ المستردة
							</p>
						</div>
						<h3 className="text-4xl font-extrabold flex items-baseline gap-1">
							{totalRefunded}
							<span className="text-lg font-medium text-emerald-100/80">
								شيكل
							</span>
						</h3>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-gray-100/50 dark:border-gray-700/50 flex flex-col sm:flex-row gap-4 relative z-20">
				<form className="flex-1 flex flex-col sm:flex-row gap-5 w-full">
					<div className="flex-1">
						<label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
							التاريخ
						</label>
						<input
							type="date"
							name="date"
							defaultValue={dateFilter}
							className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
						/>
					</div>
					<div className="flex-1">
						<label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
							المعلم
						</label>
						<select
							name="teacher"
							defaultValue={teacherFilter}
							className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
						>
							<option value="">الجميع</option>
							{teachers.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
					</div>
					<div className="flex items-end gap-3">
						<button
							type="submit"
							className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-2.5 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-md"
						>
							تصفية
						</button>
						{(dateFilter || teacherFilter) && (
							<Link
								href="/dashboard/parent/financials"
								className="text-red-500 text-sm font-bold hover:underline self-center bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/50 mb-1"
							>
								إلغاء الفلتر
							</Link>
						)}
					</div>
				</form>
			</div>

			{/* Transactions List */}
			<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-gray-100/50 dark:border-gray-700/50 overflow-hidden relative z-10">
				<div className="p-6 border-b border-gray-100/50 dark:border-gray-700/50 flex justify-between items-center bg-gradient-to-l from-gray-50/50 to-transparent dark:from-gray-900/10">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
						<div className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl">
							<HandCoins className="w-5 h-5" />
						</div>
						حركات الدفع والاسترداد
					</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-right">
						<thead>
							<tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100/50 dark:border-gray-700/50">
								<th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
									التاريخ
								</th>
								<th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
									المعلم / الخدمة
								</th>
								<th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
									الطالب
								</th>
								<th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
									المبلغ
								</th>
								<th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
									حالة الدفع
								</th>
								<th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
									النزاع
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100/50 dark:divide-gray-700/50">
							{bookings.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-12 text-center text-gray-500"
									>
										لا توجد حركات مالية مسجلة.
									</td>
								</tr>
							) : (
								bookings.map((booking) => (
									<tr
										key={booking.id}
										className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
									>
										<td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
											{booking.createdAt.toLocaleDateString("ar-SA")}
										</td>
										<td className="px-6 py-4">
											<div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
												<span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-[10px]">
													م
												</span>
												{booking.teacherService.teacher.user.name}
											</div>
											<div className="text-xs text-gray-500 mt-1">
												{booking.teacherService.serviceType.name}
											</div>
										</td>
										<td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-200">
											<div className="flex items-center gap-1.5">
												<span className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-[8px]">
													ط
												</span>
												{booking.student.name}
											</div>
										</td>
										<td className="px-6 py-4">
											<span className="font-extrabold text-gray-900 dark:text-white">
												{Number(booking.price).toFixed(2)}
											</span>
											<span className="text-xs text-gray-500 mr-1">شيكل</span>
										</td>
										<td className="px-6 py-4">
											{renderPaymentStatus(booking)}
										</td>
										<td className="px-6 py-4">
											{renderDisputeAction(booking)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
