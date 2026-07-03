import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import BookingJourneyHeader from "@/components/shared/booking-journey/BookingJourneyHeader";
import TimeFirstBookingForm from "@/components/shared/TimeFirstBookingForm";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { BookingService } from "@/lib/services/domain/booking-service";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BookByTimePage() {
    const t = await getTranslations('parent')
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session) redirect("/login");

	const userId = session.user.id;
	const { students, parentUser, subjects } =
		await BookingService.getBookByTimeData(userId);

	return (
		<div className="space-y-4 relative min-h-[500px]" dir="rtl">
			<div className="max-w-4xl mx-auto space-y-6 pb-20">
				<BookingJourneyHeader
					title={t('key_1783109439408_ghgg')}
					subtitle={t('str_2KfZhNio')}
					character="hakeem"
					characterMessage={t('str_2K7Zitin')}
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
