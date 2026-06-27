import { UserType } from "@prisma/client";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import ParentBookingsList from "@/app/dashboard/parent/_components/ParentBookingsList";
import { auth } from "@/lib/auth";
import { BookingService } from "@/lib/services/domain/booking-service";
import { sanitizePrismaData } from "@/lib/utils";

export default async function ParentBookingsPage() {
	const session = await auth();
	if (!session) redirect("/login");

	const { bookings, insights } = await BookingService.getParentBookings(
		session.user.id,
	);

	const sanitizedBookings = sanitizePrismaData(bookings);
	const hakeemMsg = insights.hakeemMsg;

	return (
		<div className="space-y-8" dir="rtl">
			<div>
				<h1 className="text-2xl font-black mb-4 text-primary">
					حجوزاتي وجلساتي
				</h1>
				<InteractiveMessage character="hakeem" message={hakeemMsg} />
			</div>

			<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
				<h2 className="font-black text-lg border-b border-border/50 pb-3 flex items-center gap-2">
					<Calendar className="h-6 w-6 text-secondary" />
					سجل الحصص والطلبات
				</h2>

				<ParentBookingsList bookings={sanitizedBookings} insights={insights} />
			</div>
		</div>
	);
}
