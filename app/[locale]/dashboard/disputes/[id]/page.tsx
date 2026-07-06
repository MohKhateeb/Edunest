import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DisputeChat } from "@/components/shared/DisputeChat";
import { getSecureDisputeDetails } from "@/lib/actions/disputes";
import { requireAuth } from "@/lib/require-auth";

export async function generateMetadata({ params }: { params: Promise<{ id: string, locale: string }> }) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'common' });
	return {
		title: t('edunest'),
	};
}

export default async function DisputePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
    const t = await getTranslations('common')
	const { userId, userType } = await requireAuth([
		UserType.ADMIN,
		UserType.PARENT,
		UserType.TEACHER,
	]);
	const { id } = await params;

	const dispute = await getSecureDisputeDetails(id);

	if (!dispute) {
		notFound();
	}

	// Dynamic back link based on role
	const backLink =
		userType === "ADMIN"
			? "/dashboard/admin/financials"
			: userType === "TEACHER"
				? "/dashboard/teacher/earnings"
				: "/dashboard/parent/financials";

	return (
		<div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex items-center gap-4">
				<Link
					href={backLink}
					className="text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
				>
					<svg
						className="w-6 h-6 rotate-180"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M15 19l-7-7 7-7"
						></path>
					</svg>
				</Link>
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						{t('key_1783109434534_ebnp')}</h1>
					<p className="text-sm text-gray-500">
						{t('key_1783109434542_t7lg')}{dispute.bookingId}
					</p>
				</div>
			</div>

			<div className="grid lg:grid-cols-3 gap-6">
				{/* Booking Details Sidebar */}
				<div className="space-y-6">
					<div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
						<h3 className="font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
							{t('key_1783109434550_5pcd')}</h3>
						<ul className="space-y-3 text-sm">
							<li className="flex justify-between">
								<span className="text-gray-500">{t('almalm')}</span>
								<span className="font-medium text-gray-900 dark:text-white">
									{dispute.booking.teacherService.teacher.user.name}
								</span>
							</li>
							<li className="flex justify-between">
								<span className="text-gray-500">{t('wly_alamr_1')}</span>
								<span className="font-medium text-gray-900 dark:text-white">
									{dispute.booking.parent.name}
								</span>
							</li>
							<li className="flex justify-between">
								<span className="text-gray-500">{t('key_1783109434580_r3vo')}</span>
								<span className="font-medium text-gray-900 dark:text-white">
									{dispute.booking.teacherService.serviceType.name}
								</span>
							</li>
							<li className="flex justify-between">
								<span className="text-gray-500">{t('key_1783109434588_16k8')}</span>
								<span className="font-medium text-gray-900 dark:text-white">
									{dispute.booking.startTime.toLocaleDateString("ar-SA")}
								</span>
							</li>
							<li className="flex justify-between">
								<span className="text-gray-500">{t('key_1783109434598_q9rr')}</span>
								<span className="font-bold text-blue-600">
									{Number(dispute.booking.price)} {t('shykl_1')}</span>
							</li>
						</ul>
					</div>

					<div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/50">
						<h3 className="font-bold text-red-800 dark:text-red-400 mb-2">
							{t('key_1783109434613_8m9j')}</h3>
						<p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
							{dispute.reason}
						</p>
					</div>
				</div>

				{/* Chat Component */}
				<div className="lg:col-span-2">
					<DisputeChat
						disputeId={dispute.id}
						status={dispute.status}
						allowedTurn={dispute.allowedTurn}
						messages={dispute.messages}
						currentUserId={userId}
						currentUserType={userType}
					/>
				</div>
			</div>
		</div>
	);
}
