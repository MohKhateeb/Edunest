import { getTranslations } from "next-intl/server";
import { UserType } from "@prisma/client";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import AdminBookingsList from "../_components/AdminBookingsList";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { BookingService } from "@/lib/services/domain/booking-service";
import { sanitizePrismaData } from "@/lib/utils";

export default async function AdminBookingsPage() {
    const t = await getTranslations('admin')
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	const result = await BookingService.getAdminBookings();
	const sanitizedResult = sanitizePrismaData(result);

	

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">{t('bookings_page_title')}</h1>
				<p className="text-xs text-muted-foreground">
					{t('bookings_page_subtitle')}
				</p>
			</div>

			<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
				<h2 className="font-extrabold text-base border-b border-border pb-2.5 flex items-center gap-2">
					<Calendar className="h-5 w-5 text-primary" />
					{t('bookings_page_list_count_prefix')}{result.totalCount ?? result.data.length})
				</h2>

				<AdminBookingsList initialData={sanitizedResult} />
			</div>
		</div>
	);
}
