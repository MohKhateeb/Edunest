import { UserType } from "@prisma/client";
import {
	AlertCircle,
	ArrowRight,
	Calendar,
	CheckCircle2,
	Clock,
	CreditCard,
	FileText,
	Landmark,
	User,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/require-auth";
import { BookingService } from "@/lib/services/domain/booking-service";
import { BOOKING_STATUS_AR, BOOKING_STATUS_STYLES } from "@/lib/translations";
import { calculateEarnings } from "@/lib/utils/financial";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
    const t = await getTranslations('teachers')
	const resolvedParams = await params;
	return {
		title: `تفاصيل الجلسة #${resolvedParams.id.slice(0, 8)} | EduNest`,
	};
}

export default async function TeacherBookingDetailsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const t = await getTranslations('teachers');
	const { userId } = await requireAuth([UserType.TEACHER]);
	const resolvedParams = await params;

	const booking = await BookingService.getTeacherBookingDetails(
		resolvedParams.id,
		userId,
	);

	if (!booking) {
		notFound();
	}

	const price = Number(booking.price);
	const commissionRate = Number(booking.appliedCommissionRate);

	const { commissionAmount, teacherTotalEarnings: netProfit } =
		calculateEarnings(
			price,
			commissionRate,
			booking.isTrial,
			Number(booking.trialCostToPlatform),
		);

	const endTime = new Date(
		booking.startTime.getTime() + booking.duration * 60000,
	);
	const notes = booking.parentNotes || booking.questionDetails;

	return (
		<div
			className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10"
			dir="rtl"
		>
			{/* Header & Back Button */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<Link
						href="/dashboard/teacher/earnings?tab=history"
						className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mb-2"
					>
						<ArrowRight className="w-4 h-4" /> {t('key_1783109439416_owc9')}</Link>
					<h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
						{t('key_1783109438785_td74')}<span className="text-lg font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
							#{booking.id.slice(0, 8)}
						</span>
					</h1>
				</div>
				<div>
					<span
						className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border ${BOOKING_STATUS_STYLES[booking.status]}`}
					>
						{booking.status === "COMPLETED" && (
							<CheckCircle2 className="w-4 h-4" />
						)}
						{BOOKING_STATUS_AR[booking.status] || booking.status}
					</span>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Right Column: Session & Student Details */}
				<div className="lg:col-span-2 space-y-6">
					{/* Main Info Card */}
					<div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
						<div className="absolute top-0 end-0 w-1.5 h-full bg-blue-500"></div>
						<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
							<FileText className="w-5 h-5 text-blue-500" />
							{t('key_1783109439457_50tw')}</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<p className="text-sm text-gray-500 mb-1">{t('key_1783109439472_pvst')}</p>
								<p className="font-bold text-gray-900 dark:text-white text-lg">
									{booking.teacherService.serviceType.name}
								</p>
								{booking.isTrial && (
									<span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
										{t('key_1783109439485_jl4x')}</span>
								)}
							</div>

							<div>
								<p className="text-sm text-gray-500 mb-1">{t('key_1783109439496_7mnk')}</p>
								<div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-lg">
									<Calendar className="w-4 h-4 text-gray-400" />
									{booking.startTime.toLocaleDateString("ar-SA")}
								</div>
								<div className="flex items-center gap-2 mt-1 text-gray-600 dark:text-gray-300">
									<Clock className="w-4 h-4 text-gray-400" />
									{booking.startTime.toLocaleTimeString("ar-SA", {
										hour: "2-digit",
										minute: "2-digit",
									})}{" "}
									-{" "}
									{endTime.toLocaleTimeString("ar-SA", {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>
							</div>
						</div>

						{notes && (
							<div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
								<p className="text-sm text-gray-500 mb-2">{t('key_1783109439509_d2lf')}</p>
								<div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-gray-700 dark:text-gray-300 text-sm leading-relaxed border border-gray-100 dark:border-gray-700">
									{notes}
								</div>
							</div>
						)}
					</div>

					{/* Student Info Card */}
					<div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
						<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
							<User className="w-5 h-5 text-indigo-500" />
							{t('key_1783109439521_qa73')}</h2>

						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl border border-indigo-200 dark:border-indigo-800">
								{booking.student.name.charAt(0)}
							</div>
							<div>
								<p className="font-bold text-gray-900 dark:text-white text-lg">
									{booking.student.name}
								</p>
								<p className="text-sm text-gray-500 flex items-center gap-1">
									{t('key_1783109439533_ikx4')}{booking.student.parent.name}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Left Column: Financials & Disputes */}
				<div className="space-y-6">
					{/* Financial Breakdown Card */}
					<div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
						<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
							<CreditCard className="w-5 h-5 text-emerald-500" />
							{t('key_1783109439550_ivhh')}</h2>

						<div className="space-y-4">
							<div className="flex justify-between items-center text-sm">
								<span className="text-gray-500">{t('key_1783109439570_st5c')}</span>
								<span className="font-bold text-gray-900 dark:text-white">
									{price.toFixed(2)} ₪
								</span>
							</div>

							{!booking.isTrial && (
								<div className="flex justify-between items-center text-sm">
									<span className="text-gray-500">
										{t('key_1783109439589_muva')}{commissionRate}%)
									</span>
									<span className="font-bold text-red-500">
										-{commissionAmount.toFixed(2)} ₪
									</span>
								</div>
							)}

							{booking.isTrial && (
								<div className="flex justify-between items-center text-sm">
									<span className="text-gray-500">{t('key_1783109439609_veie')}</span>
									<span className="font-bold text-emerald-500">
										+{netProfit.toFixed(2)} ₪
									</span>
								</div>
							)}

							<div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
								<span className="font-bold text-gray-900 dark:text-white">
									{t('key_1783109439623_mq9v')}</span>
								<span className="font-black text-2xl text-emerald-600 dark:text-emerald-400">
									{netProfit.toFixed(2)} ₪
								</span>
							</div>
						</div>

						{/* Financial Status */}
						<div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
							{booking.payoutId ? (
								<div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl flex flex-col gap-1 border border-emerald-100 dark:border-emerald-900/30">
									<div className="flex items-center gap-2 font-bold text-sm">
										<Landmark className="w-4 h-4" />
										{t('key_1783109439637_2a26')}</div>
									<Link
										href="/dashboard/teacher/earnings?tab=payouts"
										className="text-xs underline hover:text-emerald-800 transition-colors"
									>
										{t('key_1783109439652_hnaq')}</Link>
								</div>
							) : (
								<div className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 p-3 rounded-xl flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-sm font-bold">
									<Wallet className="w-4 h-4" />
									{t('key_1783109439688_8agh')}</div>
							)}
						</div>
					</div>

					{/* Dispute Card */}
					{booking.dispute && (
						<div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/30 shadow-sm relative overflow-hidden group">
							<div className="absolute top-0 end-0 w-1.5 h-full bg-red-400 dark:bg-red-600"></div>
							<h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
								<AlertCircle className="w-5 h-5" />
								{t('key_1783109439704_mcbh')}</h2>

							<div className="mb-4">
								<span
									className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
										booking.dispute.status === "OPEN"
											? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-amber-200"
											: booking.dispute.status ===
													"RESOLVED_IN_FAVOR_OF_TEACHER"
												? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 ring-1 ring-emerald-200"
												: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 ring-1 ring-red-200"
									}`}
								>
									{booking.dispute.status === "OPEN" ? (
										<>
											<span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>{" "}
											{t('key_1783109437597_84u6')}</>
									) : booking.dispute.status ===
										"RESOLVED_IN_FAVOR_OF_TEACHER" ? (
										<>
											<CheckCircle2 className="w-4 h-4" /> {t('key_1783109438735_pi1n')}</>
									) : (
										<>
											<AlertCircle className="w-4 h-4" /> {t('key_1783109438753_5o9b')}</>
									)}
								</span>
							</div>

							<Link
								href={`/dashboard/disputes/${booking.dispute.id}`}
								className="flex justify-center items-center gap-2 w-full text-sm font-bold text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-blue-600 dark:hover:bg-blue-500 px-4 py-3 rounded-xl transition-all shadow-sm"
							>
								{t('key_1783109439763_vshw')}<ArrowRight className="w-4 h-4 rotate-180" />
							</Link>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
