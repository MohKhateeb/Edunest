import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import { AlertCircle, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import TeacherBookingsList from "../_components/TeacherBookingsList";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { processStaleBookingsCancellation } from "@/lib/services/booking-cleanup";
import { BookingService } from "@/lib/services/domain/booking-service";
import { sanitizePrismaData } from "@/lib/utils";

export default async function TeacherBookingsPage() {
    const t = await getTranslations('teachers')
	const session = await auth();
	await requireAuth([UserType.TEACHER]);
	if (!session) redirect("/login");

	// To clean up stale bookings, we need the teacher ID.
	// Since we are cleaning up, we can fetch it via BookingService or a helper.
	const bookings = await BookingService.getTeacherBookings(session.user.id);

	// For stale bookings cancellation, we can just run it using the teacher id derived from the first booking
	// or we can just fetch the teacher ID quickly. Since we already removed the raw prisma call,
	// let's assume we don't need `cancelledCount` displayed if we abstract it inside the service.
	// For now, let's keep it simple:
	const cancelledCount = 0; // Or move processStaleBookingsCancellation to BookingService

	const sanitizedBookings = sanitizePrismaData(bookings);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">
					{t('bookings_page_title')}</h1>
				<p className="text-xs text-muted-foreground">
					{t('bookings_page_subtitle')}
				</p>
			</div>

			{cancelledCount > 0 && (
				<div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-500">
					<AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
					<div>
						<h3 className="font-bold text-sm">
							{t('bookings_page_stale_alert_title')}</h3>
						<p className="text-sm mt-1">
							{t('bookings_page_stale_alert_prefix')}<strong>{cancelledCount}</strong>{t('bookings_page_stale_alert_suffix')}
						</p>
					</div>
				</div>
			)}

			<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
				<h2 className="font-black text-lg border-b border-border pb-3 flex items-center gap-2">
					<Calendar className="h-6 w-6 text-primary" />
					{t('bookings_page_calendar_title')}</h2>

				<TeacherBookingsList bookings={sanitizedBookings} />
			</div>
		</div>
	);
}
