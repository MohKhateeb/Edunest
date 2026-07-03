import { UserType } from "@prisma/client";
import { FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { BookingService } from "@/lib/services/domain/booking-service";
import { sanitizePrismaData } from "@/lib/utils";
import PendingReportsClient from "./_components/PendingReportsClient";
import { getTranslations } from "next-intl/server";

export default async function TeacherPendingReportsPage() {
    const t = await getTranslations('teachers')
	const session = await auth();
	await requireAuth([UserType.TEACHER]);

	if (!session) redirect("/login");

	const pendingBookings = await BookingService.getTeacherPendingReports(
		session.user.id,
	);
	const sanitizedBookings = sanitizePrismaData(pendingBookings);

	return (
		<div className="space-y-6 text-end" dir="rtl">
			<div>
				<h1 className="text-2xl font-black flex items-center gap-2">
					<FileText className="h-7 w-7 text-primary" />
					{t('key_1783109439058_ulm4')}</h1>
				<p className="text-muted-foreground mt-1">
					{t('key_1783109439060_u3m6')}</p>
			</div>

			<PendingReportsClient initialBookings={sanitizedBookings} />
		</div>
	);
}
