import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import { AlertCircle, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import TeacherBookingsList from "../_components/TeacherBookingsList";
import TimeRangeTabs from "@/components/shared/TimeRangeTabs";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { BookingService } from "@/lib/services/domain/booking-service";
import { sanitizePrismaData } from "@/lib/utils";
import type { TimeRangeOption } from "@/lib/utils/date-range";

export default async function TeacherBookingsPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const resolvedSearchParams = await searchParams;
	const t = await getTranslations("teachers");
	const session = await auth();
	await requireAuth([UserType.TEACHER]);
	if (!session) redirect("/login");

	const range = (resolvedSearchParams.range as TimeRangeOption) || "this_month";

	const bookings = await BookingService.getTeacherBookings(session.user.id, range);

	// For stale bookings cancellation — hardcoded to 0, outside scope of this batch
	const cancelledCount = 0;

	const sanitizedBookings = sanitizePrismaData(bookings);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">
					{t("bookings_page_title")}</h1>
				<p className="text-xs text-muted-foreground">
					{t("bookings_page_subtitle")}
				</p>
			</div>

			{cancelledCount > 0 && (
				<div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-500">
					<AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
					<div>
						<h3 className="font-bold text-sm">
							{t("bookings_page_stale_alert_title")}</h3>
						<p className="text-sm mt-1">
							{t("bookings_page_stale_alert_prefix")}<strong>{cancelledCount}</strong>{t("bookings_page_stale_alert_suffix")}
						</p>
					</div>
				</div>
			)}

			<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
				<h2 className="font-black text-lg border-b border-border pb-3 flex items-center gap-2">
					<Calendar className="h-6 w-6 text-primary" />
					{t("bookings_page_calendar_title")}</h2>

				<TimeRangeTabs />
				<TeacherBookingsList bookings={sanitizedBookings} />
			</div>
		</div>
	);
}
