import { UserType } from "@prisma/client";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import AdminBookingsList from "@/app/dashboard/admin/_components/AdminBookingsList";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { BookingService } from "@/lib/services/domain/booking-service";
import { sanitizePrismaData } from "@/lib/utils";

export default async function AdminBookingsPage() {
	const session = await auth();
	await requireAuth([UserType.ADMIN]);
	if (!session) redirect("/login");

	const bookings = await BookingService.getAdminBookings();

	const sanitizedBookings = sanitizePrismaData(bookings);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">إدارة كل الحجوزات</h1>
				<p className="text-xs text-muted-foreground">
					عرض ومتابعة كافة المواعيد والطلبات المسجلة في المنصة وإدارتها أو
					إلغائها عند الضرورة.
				</p>
			</div>

			<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
				<h2 className="font-extrabold text-base border-b border-border pb-2.5 flex items-center gap-2">
					<Calendar className="h-5 w-5 text-primary" />
					كل الطلبات والحصص ({bookings.length})
				</h2>

				<AdminBookingsList bookings={sanitizedBookings} />
			</div>
		</div>
	);
}
