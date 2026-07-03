import { UserType } from "@prisma/client";
import { requireAuth } from "@/lib/require-auth";
import { auth } from "@/lib/auth";
import { analyticsRepository } from "@/lib/repositories/analytics-repository";
import { teacherRepository } from "@/lib/repositories/prisma/teacher.repository";
import { sanitizePrismaData } from "@/lib/utils";

import AccountStatusBanner from "@/components/teacher/dashboard/AccountStatusBanner";
import WelcomeHeader from "@/components/teacher/dashboard/WelcomeHeader";
import UrgentMattersSection from "@/components/teacher/dashboard/UrgentMattersSection";
import LiveSessionBanner from "@/components/teacher/dashboard/LiveSessionBanner";
import TeacherStatsGrid from "@/components/teacher/dashboard/TeacherStatsGrid";
import EarningsChartSection from "@/components/teacher/dashboard/EarningsChartSection";
import PendingRequestsSection from "@/components/teacher/dashboard/PendingRequestsSection";
import NextLessonSection from "@/components/teacher/dashboard/NextLessonSection";
import VerificationStatusSection from "@/components/teacher/dashboard/VerificationStatusSection";

export default async function TeacherDashboard() {
	await requireAuth([UserType.TEACHER]);
	const session = await auth();
	if (!session) return null;

	const teacher = await teacherRepository.findByUserId(session.user.id);
	let data = null;
	if (teacher) {
		const end = new Date();
		const start = new Date(new Date().setDate(end.getDate() - 30));
		data = await analyticsRepository.getTeacherDashboardOverview(teacher.id, start, end);
	}
	if (!data) return <AccountStatusBanner />;

	const reqs = sanitizePrismaData(data.pendingRequests);
	const next = sanitizePrismaData(data.nextSession);
	const live = data.liveSession ? sanitizePrismaData(data.liveSession) : null;

	return (
		<div className="space-y-8 text-right pb-10" dir="rtl">
			<WelcomeHeader teacherName={session.user.name || ""} teacherSlug={data.teacher.slug} isAvailableNow={data.teacher.isAvailableNow} />
			<UrgentMattersSection isVerified={data.teacher.isVerified} openDisputes={data.openDisputes} urgentAlerts={data.urgentAlerts} />
			<LiveSessionBanner liveSession={live} />
			<TeacherStatsGrid pendingRequestsCount={reqs.length} totalEarnings={data.totalEarnings} totalSessions={data.teacher.totalSessions} averageRating={Number(data.teacher.averageRating)} upcomingCount={data.upcomingCount} />
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<EarningsChartSection chartData={data.chartData} />
					<PendingRequestsSection pendingRequests={reqs} />
				</div>
				<div className="space-y-6">
					<NextLessonSection nextSession={next} />
					<VerificationStatusSection isVerified={data.teacher.isVerified} verificationLevel={data.teacher.verificationLevel} />
				</div>
			</div>
		</div>
	);
}
