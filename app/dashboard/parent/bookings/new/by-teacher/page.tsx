import { UserType } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import NewBookingForm from "@/components/shared/NewBookingForm";
import CharacterDialogue from "@/components/shared/booking-journey/CharacterDialogue";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { BookingService } from "@/lib/services/domain/booking-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BookByTeacherPage() {
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session) redirect("/login");

	const userId = session.user.id;

	const { students, parentUser, teachersWithBookings } = await BookingService.getBookByTeacherData(userId);

	return (
		<div className="space-y-4 relative min-h-[500px]" dir="rtl">
			<div className="text-center space-y-1 mb-8">
				<h1 className="text-3xl font-black text-slate-900 dark:text-white">
					حجز جلسة جديدة
				</h1>
				<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
					البحث بالمعلم
				</p>
			</div>

			<div className="max-w-4xl mx-auto space-y-6 pb-20">
				{/* Header with back button and dialogue */}
				<div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
					<Link
						href="/dashboard/parent/bookings/new"
						className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md"
					>
						<ArrowRight className="w-4 h-4" />
						تغيير مسار الحجز
					</Link>

					<div className="flex-1 max-w-lg">
						<CharacterDialogue
							character="najeeb"
							najeebMode="success"
							message="اختيار ممتاز! تصفح قائمة المعلمين، واختر من يلبي طموحك، وأكمل تفاصيل الحجز وسنتولى نحن الباقي."
							align="right"
						/>
					</div>
				</div>

				<NewBookingForm
					students={students}
					teachers={teachersWithBookings}
					hasUsedTrial={parentUser?.hasUsedFreeTrial ?? false}
				/>
			</div>
		</div>
	);
}
