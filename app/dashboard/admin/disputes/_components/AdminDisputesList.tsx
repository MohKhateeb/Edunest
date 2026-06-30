"use client";

import type { DisputeStatus } from "@prisma/client";
import { CheckCircle2, ChevronLeft, Search, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { SystemAdminService } from "@/lib/services/domain/system-admin-service";
import { DISPUTE_STATUS_AR, DISPUTE_STATUS_STYLES } from "@/lib/translations";

type AdminDispute = Awaited<
	ReturnType<typeof SystemAdminService.getAdminDisputes>
>["items"][0];

interface AdminDisputesListProps {
	initialData: AdminDispute[];
}

const renderDisputeStatus = (status: DisputeStatus) => {
	const label = DISPUTE_STATUS_AR[status];
	const style = DISPUTE_STATUS_STYLES[status];

	return (
		<span
			className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${style}`}
		>
			{status === "OPEN" && (
				<span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
			)}
			{label}
		</span>
	);
};

export default function AdminDisputesList({
	initialData,
}: AdminDisputesListProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<DisputeStatus | "ALL">(
		"ALL",
	);

	// Client-side filtering logic
	const filteredDisputes = initialData.filter((dispute) => {
		const query = searchQuery.toLowerCase();
		const teacherName =
			dispute.booking.teacherService.teacher.user.name.toLowerCase();
		const parentName = dispute.booking.parent.name.toLowerCase();
		const reason = dispute.reason.toLowerCase();

		const matchesSearch =
			teacherName.includes(query) ||
			parentName.includes(query) ||
			reason.includes(query);

		const matchesStatus =
			statusFilter === "ALL" || dispute.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	return (
		<div className="space-y-6">
			{/* Filters Bar */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1">
					<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
						<Search className="h-4 w-4 text-muted-foreground" />
					</div>
					<input
						type="text"
						placeholder="البحث باسم المعلم، ولي الأمر، أو سبب النزاع..."
						className="block w-full rounded-2xl border-0 py-3 pr-10 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-slate-800 dark:text-white sm:text-sm sm:leading-6 transition-all"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				<div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
					<div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-max sm:w-auto gap-1">
						<button
							onClick={() => setStatusFilter("ALL")}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
								statusFilter === "ALL"
									? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
									: "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
							}`}
						>
							الكل
						</button>
						<button
							onClick={() => setStatusFilter("OPEN")}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
								statusFilter === "OPEN"
									? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
									: "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
							}`}
						>
							{DISPUTE_STATUS_AR.OPEN}
						</button>
						<button
							onClick={() => setStatusFilter("RESOLVED_IN_FAVOR_OF_PARENT")}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
								statusFilter === "RESOLVED_IN_FAVOR_OF_PARENT"
									? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
									: "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
							}`}
						>
							{DISPUTE_STATUS_AR.RESOLVED_IN_FAVOR_OF_PARENT}
						</button>
						<button
							onClick={() => setStatusFilter("RESOLVED_IN_FAVOR_OF_TEACHER")}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
								statusFilter === "RESOLVED_IN_FAVOR_OF_TEACHER"
									? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
									: "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
							}`}
						>
							{DISPUTE_STATUS_AR.RESOLVED_IN_FAVOR_OF_TEACHER}
						</button>
					</div>
				</div>
			</div>

			{/* Results Summary */}
			{searchQuery && (
				<div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
					العثور على {filteredDisputes.length} نتيجة مطابقة لبحثك "{searchQuery}
					"
				</div>
			)}

			{/* Disputes List */}
			<div className="bg-white dark:bg-slate-900 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-gray-100/50 dark:border-gray-700/50 overflow-hidden relative z-10">
				<div className="overflow-x-auto">
					<table className="w-full text-right">
						<thead>
							<tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100/50 dark:border-gray-700/50">
								<th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
									تاريخ الجلسة
								</th>
								<th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
									الأطراف
								</th>
								<th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
									سبب النزاع
								</th>
								<th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
									الحالة
								</th>
								<th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
									إجراء
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100/50 dark:divide-gray-700/50">
							{filteredDisputes.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-12 text-center text-gray-500"
									>
										<div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
											<div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
												<CheckCircle2 className="w-8 h-8" />
											</div>
											<p className="font-bold text-lg text-slate-800 dark:text-slate-200">
												لا توجد نزاعات مطابقة
											</p>
											<p className="text-sm text-slate-500 mt-1">
												جرب تغيير حالة الفلتر أو مصطلحات البحث.
											</p>
										</div>
									</td>
								</tr>
							) : (
								filteredDisputes.map((dispute) => (
									<tr
										key={dispute.id}
										className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
									>
										<td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
											{new Date(dispute.booking.startTime).toLocaleDateString(
												"ar-SA",
											)}
										</td>
										<td className="px-6 py-4">
											<div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
												<span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-[10px]">
													م
												</span>
												{dispute.booking.teacherService.teacher.user.name}
											</div>
											<div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mt-2">
												<span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 text-[10px]">
													أ
												</span>
												{dispute.booking.parent.name}
											</div>
										</td>
										<td className="px-6 py-4">
											<p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 max-w-xs">
												{dispute.reason}
											</p>
										</td>
										<td className="px-6 py-4">
											{renderDisputeStatus(dispute.status)}
										</td>
										<td className="px-6 py-4">
											<Link
												href={`/dashboard/disputes/${dispute.id}`}
												className="text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1 transition-all max-w-fit"
											>
												التفاصيل
												<ChevronLeft className="w-3 h-3" />
											</Link>
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
