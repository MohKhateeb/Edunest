import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import BookingJourneyHeader from "@/components/shared/booking-journey/BookingJourneyHeader";
import TimeFirstBookingForm from "@/components/shared/TimeFirstBookingForm";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { BookingService } from "@/lib/services/domain/booking-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BookByTimePage() {
    const t = await getTranslations('parent');
    const tAdvisors = await getTranslations('advisors');
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session) redirect("/login");

	const userId = session.user.id;
	const { students, parentUser, subjects } =
		await BookingService.getBookByTimeData(userId);

	return (
		<div className="space-y-4 relative min-h-[500px]">
			<div className="max-w-4xl mx-auto space-y-6 pb-20">
				<BookingJourneyHeader
					title="حجز جلسة جديدة"
					subtitle={t('str_2KfZhNio')}
					character="hakeem"
					characterMessage={tAdvisors('hakeem_booking_time_tip')}
				/>

				<TimeFirstBookingForm
					students={students}
					subjects={subjects}
					hasUsedTrial={parentUser?.hasUsedFreeTrial ?? false}
				/>
			</div>
		</div>
	);
}
