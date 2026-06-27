import { UserType } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DisputeChat } from "@/components/shared/DisputeChat";
import { requireAuth } from "@/lib/require-auth";
import { SystemAdminService } from "@/lib/services/domain/system-admin-service";

export const metadata = {
	title: "تفاصيل النزاع | EduNest",
};

export default async function DisputePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { userId, userType } = await requireAuth([
		UserType.ADMIN,
		UserType.PARENT,
		UserType.TEACHER,
	]);
	const { id } = await params;

	const dispute = await SystemAdminService.getDisputeDetails(id);

	if (!dispute) {
		notFound();
	}

	// Authorization Check:
	if (userType === "PARENT" && dispute.booking.parentUserId !== userId) {
		redirect("/unauthorized");
	}
	if (
		userType === "TEACHER" &&
		dispute.booking.teacherService.teacher.userId !== userId
	) {
		redirect("/unauthorized");
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
						تفاصيل ومحادثة النزاع
					</h1>
					<p className="text-sm text-gray-500">
						رقم الحجز: {dispute.bookingId}
					</p>
				</div>
			</div>

			<div className="grid lg:grid-cols-3 gap-6">
				{/* Booking Details Sidebar */}
				<div className="space-y-6">
					<div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
						<h3 className="font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
							معلومات الجلسة
						</h3>
						<ul className="space-y-3 text-sm">
							<li className="flex justify-between">
								<span className="text-gray-500">المعلم:</span>
								<span className="font-medium text-gray-900 dark:text-white">
									{dispute.booking.teacherService.teacher.user.name}
								</span>
							</li>
							<li className="flex justify-between">
								<span className="text-gray-500">ولي الأمر:</span>
								<span className="font-medium text-gray-900 dark:text-white">
									{dispute.booking.parent.name}
								</span>
							</li>
							<li className="flex justify-between">
								<span className="text-gray-500">الخدمة:</span>
								<span className="font-medium text-gray-900 dark:text-white">
									{dispute.booking.teacherService.serviceType.name}
								</span>
							</li>
							<li className="flex justify-between">
								<span className="text-gray-500">التاريخ:</span>
								<span className="font-medium text-gray-900 dark:text-white">
									{dispute.booking.startTime.toLocaleDateString("ar-SA")}
								</span>
							</li>
							<li className="flex justify-between">
								<span className="text-gray-500">المبلغ المدفوع:</span>
								<span className="font-bold text-blue-600">
									{Number(dispute.booking.price)} شيكل
								</span>
							</li>
						</ul>
					</div>

					<div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-100 dark:border-red-900/50">
						<h3 className="font-bold text-red-800 dark:text-red-400 mb-2">
							سبب الاعتراض الأولي
						</h3>
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
