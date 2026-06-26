import { UserType } from "@prisma/client";
import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import InteractiveMessage from "@/components/shared/InteractiveMessage";
import ParentBookingsList from "@/app/dashboard/parent/_components/ParentBookingsList";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { bookingDetailsInclude, type DetailedBooking } from "@/lib/types";
import { sanitizePrismaData } from "@/lib/utils";

export default async function ParentBookingsPage() {
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session) redirect("/login");

	const userId = session.user.id;

	const bookings: DetailedBooking[] = await prisma.booking.findMany({
		where: { parentUserId: userId },
		include: bookingDetailsInclude,
		orderBy: { startTime: "asc" },
	});

	const sanitizedBookings = sanitizePrismaData(bookings);

	const confirmedCount = bookings.filter(
		(b) => b.status === "CONFIRMED",
	).length;
	const hakeemMsg =
		confirmedCount > 0
			? `ممتاز، لديك ${confirmedCount} جلسة قادمة مؤكدة. المتابعة المستمرة لجدول الجلسات وحضورها في الوقت المحدد هو مفتاح التفوق والتميز لأبنائك.`
			: "ليس لديك أي جلسات قادمة مؤكدة حالياً. متابعة التقارير للجلسات السابقة يساعدك في تحديد ما يحتاجه أبناؤك في الجلسات القادمة.";

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

				<ParentBookingsList bookings={sanitizedBookings} />
			</div>
		</div>
	);
}
