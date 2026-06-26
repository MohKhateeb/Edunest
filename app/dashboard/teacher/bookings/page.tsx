import { UserType } from "@prisma/client";
import { AlertCircle, Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import TeacherBookingsList from "@/app/dashboard/teacher/_components/TeacherBookingsList";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { processStaleBookingsCancellation } from "@/lib/services/booking-cleanup";
import { bookingDetailsInclude, type DetailedBooking } from "@/lib/types";
import { sanitizePrismaData } from "@/lib/utils";

export default async function TeacherBookingsPage() {
	const session = await auth();
	await requireAuth([UserType.TEACHER]);
	if (!session) redirect("/login");

	const userId = session.user.id;

	const teacher = await prisma.teacher.findUnique({
		where: { userId },
	});

	if (!teacher) {
		redirect("/dashboard/teacher");
	}

	// JIT Cleanup: تنظيف الجلسات المنتهية المعلقة الخاصة بهذا المعلم فقط
	const cancelledCount = await processStaleBookingsCancellation(teacher.id);

	const bookings: DetailedBooking[] = await prisma.booking.findMany({
		where: {
			teacherService: {
				teacherId: teacher.id,
			},
		},
		include: bookingDetailsInclude,
		orderBy: { createdAt: "desc" },
	});

	const sanitizedBookings = sanitizePrismaData(bookings);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-extrabold mb-1">
					جدول الحصص والطلبات الواردة
				</h1>
				<p className="text-xs text-muted-foreground">
					تابع مواعيد الحصص المجدولة للطلاب، قبول/رفض طلبات الحجز المعلقة، ورفع
					تقارير الأداء بعد انتهاء الحصص.
				</p>
			</div>

			{cancelledCount > 0 && (
				<div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4 fade-in duration-500">
					<AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
					<div>
						<h3 className="font-bold text-sm">
							تنبيه النظام: تم الإلغاء التلقائي
						</h3>
						<p className="text-sm mt-1">
							تم إلغاء <strong>{cancelledCount}</strong> من طلبات الحجز تلقائياً
							نظراً لانتهاء وقتها المجدول دون قيامك بتأكيدها. يرجى المتابعة
							اليومية لطلباتك لتجنب ذلك.
						</p>
					</div>
				</div>
			)}

			<div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-4">
				<h2 className="font-black text-lg border-b border-border pb-3 flex items-center gap-2">
					<Calendar className="h-6 w-6 text-primary" />
					سجل الحصص الواردة
				</h2>

				<TeacherBookingsList bookings={sanitizedBookings} />
			</div>
		</div>
	);
}
