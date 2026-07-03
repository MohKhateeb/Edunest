import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import BookingJourneyHeader from "@/components/shared/booking-journey/BookingJourneyHeader";
import NewBookingForm from "@/components/shared/NewBookingForm";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { BookingService } from "@/lib/services/domain/booking-service";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BookByTeacherPage() {
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session) redirect("/login");

	const userId = session.user.id;
	const t = await getTranslations("bookings");

	const { students, parentUser, teachersWithBookings } =
		await BookingService.getBookByTeacherData(userId);

	return (
		<div className="space-y-4 relative min-h-[500px]">
			<div className="max-w-4xl mx-auto space-y-6 pb-20">
				<BookingJourneyHeader
					title={t("hjz_jlsh_jdydh")}
					subtitle={t("albhth_balmhlm")}
					character="najeeb"
					characterMessage={t("akhtyar_mmtaz_tsfh_qaymh_almhlmyn")}
					characterMode="success"
				/>

				<NewBookingForm
					students={students}
					teachers={teachersWithBookings}
					hasUsedTrial={parentUser?.hasUsedFreeTrial ?? false}
				/>
			</div>
		</div>
	);
}
