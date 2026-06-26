import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import BookingSelectionCards from "@/components/shared/booking-journey/BookingSelectionCards";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewBookingPageRoute() {
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session) redirect("/login");

	return (
		<div className="space-y-4 relative min-h-[500px]" dir="rtl">
			{/* عنوان الصفحة (يظهر دائماً) */}
			<div className="text-center space-y-1 mb-8">
				<h1 className="text-3xl font-black text-slate-900 dark:text-white">
					حجز جلسة جديدة
				</h1>
				<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
					ابدأ رحلة التعلم بخطوات بسيطة
				</p>
			</div>

			<BookingSelectionCards />
		</div>
	);
}
