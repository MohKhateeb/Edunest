import { DisputeStatus, Prisma, UserType } from "@prisma/client";
import { CheckCircle2, ChevronLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { DISPUTE_STATUS_AR, DISPUTE_STATUS_STYLES } from "@/lib/translations";

export const metadata = {
	title: "إدارة النزاعات | EduNest",
};

const renderDisputeStatus = (status: DisputeStatus) => {
	const label = DISPUTE_STATUS_AR[status];
	const style = DISPUTE_STATUS_STYLES[status];
	
	return (
		<span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${style}`}>
			{status === "OPEN" && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>}
			{label}
		</span>
	);
};

export default async function AdminDisputesPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	await requireAuth([UserType.ADMIN]);
	const resolvedParams = await searchParams;

	const statusFilter = resolvedParams.status as string | undefined;

	const whereClause: Prisma.DisputeWhereInput = {};
	if (statusFilter) {
		whereClause.status = statusFilter as DisputeStatus;
	}

	const disputes = await prisma.dispute.findMany({
		where: whereClause,
		include: {
			booking: {
				include: {
					teacherService: { include: { teacher: { include: { user: true } } } },
					student: true,
					parent: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-600 dark:from-red-400 dark:to-amber-400 flex items-center gap-2">
						<ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
						إدارة النزاعات الشاملة
					</h1>
					<p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
						مراقبة ومعالجة جميع النزاعات بين أولياء الأمور والمعلمين.
					</p>
				</div>
			</div>

			{/* Filters */}
			<div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-gray-100/50 dark:border-gray-700/50 flex flex-col sm:flex-row gap-4">
				<form className="flex-1 flex flex-col sm:flex-row gap-5 w-full items-end">
					<div className="flex-1 w-full">
						<label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
							حالة النزاع
						</label>
						<select
							name="status"
							defaultValue={statusFilter}
							className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 transition-all"
						>
							<option value="">جميع الحالات</option>
							<option value="OPEN">{DISPUTE_STATUS_AR.OPEN}</option>
							<option value="RESOLVED_IN_FAVOR_OF_PARENT">{DISPUTE_STATUS_AR.RESOLVED_IN_FAVOR_OF_PARENT}</option>
							<option value="RESOLVED_IN_FAVOR_OF_TEACHER">{DISPUTE_STATUS_AR.RESOLVED_IN_FAVOR_OF_TEACHER}</option>
						</select>
					</div>
					<div className="flex items-center gap-3 w-full sm:w-auto">
						<button
							type="submit"
							className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-2.5 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-md"
						>
							تصفية
						</button>
						{statusFilter && (
							<Link
								href="/dashboard/admin/disputes"
								className="text-red-500 text-sm font-bold hover:underline self-center bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/50 mb-1"
							>
								إلغاء
							</Link>
						)}
					</div>
				</form>
			</div>

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
							{disputes.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-12 text-center text-gray-500"
									>
										<div className="flex flex-col items-center justify-center">
											<div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
												<CheckCircle2 className="w-8 h-8" />
											</div>
											<p className="font-bold">لا توجد نزاعات مسجلة.</p>
										</div>
									</td>
								</tr>
							) : (
								disputes.map((dispute) => (
									<tr
										key={dispute.id}
										className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
									>
										<td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
											{dispute.booking.startTime.toLocaleDateString("ar-SA")}
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
