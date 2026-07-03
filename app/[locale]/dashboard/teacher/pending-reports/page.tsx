import { UserType } from "@prisma/client";
import { FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { BookingService } from "@/lib/services/domain/booking-service";
import { sanitizePrismaData } from "@/lib/utils";
import PendingReportsClient from "./_components/PendingReportsClient";

export default async function TeacherPendingReportsPage() {
	const session = await auth();
	await requireAuth([UserType.TEACHER]);

	if (!session) redirect("/login");

	const pendingBookings = await BookingService.getTeacherPendingReports(
		session.user.id,
	);
	const sanitizedBookings = sanitizePrismaData(pendingBookings);

	return (
		<div className="space-y-6 text-right" dir="rtl">
			<div>
				<h1 className="text-2xl font-black flex items-center gap-2">
					<FileText className="h-7 w-7 text-primary" />
					تقارير الجلسات المعلقة
				</h1>
				<p className="text-muted-foreground mt-1">
					الرجاء كتابة تقارير الأداء فوراً لتفادي تجميد أو مصادرة أرباح الجلسات.
				</p>
			</div>

			<PendingReportsClient initialBookings={sanitizedBookings} />
		</div>
	);
}
