import { getTranslations } from "next-intl/server";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import ParentBookingsList from "../_components/ParentBookingsList";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import TimeRangeTabs from "@/components/shared/TimeRangeTabs";
import { auth } from "@/lib/auth";
import { BookingService } from "@/lib/services/domain/booking-service";
import { sanitizePrismaData } from "@/lib/utils";
import type { TimeRangeOption } from "@/lib/utils/date-range";

export default async function ParentBookingsPage({
	params,
	searchParams,
}: {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { locale } = await params;
	const resolvedSearchParams = await searchParams;
	const t = await getTranslations("parent");
	const session = await auth();
	if (!session) redirect("/login");

	const range = (resolvedSearchParams.range as TimeRangeOption) || "this_month";

	const { bookings, insights } = await BookingService.getParentBookings(
		session.user.id,
		locale,
		range,
	);

	const sanitizedBookings = sanitizePrismaData(bookings);
	const hakeemMsg = insights.hakeemMsg;

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-black mb-4 text-primary">
					{t("key_1783109435554_fuzb")}</h1>
				<InteractiveMessage character="hakeem" message={hakeemMsg} />
			</div>

			<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
				<h2 className="font-black text-lg border-b border-border/50 pb-3 flex items-center gap-2">
					<Calendar className="h-6 w-6 text-secondary" />
					{t("key_1783109435556_wnzy")}</h2>

				<TimeRangeTabs />
				<ParentBookingsList bookings={sanitizedBookings} insights={insights} />
			</div>
		</div>
	);
}
