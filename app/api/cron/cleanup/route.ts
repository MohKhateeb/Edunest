import { NextResponse } from "next/server";
import { processStaleBookingsCancellation, processGhostBookingsPenalties } from "@/lib/services/booking-cleanup";

export async function GET(request: Request) {
	// الحماية: يجب التأكد من أن المستدعي هو خدمة الـ Cron (مثلاً Vercel Cron)
	const authHeader = request.headers.get("authorization");
	if (
		process.env.CRON_SECRET &&
		authHeader !== `Bearer ${process.env.CRON_SECRET}`
	) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		// التنظيف الشامل لجميع الجلسات المعلقة المنتهية في النظام (Dry & SOLED)
		const cancelledCount = await processStaleBookingsCancellation();
		
		// عقوبات التأخير للجلسات المؤكدة (التقارير المتأخرة)
		const { warningsSent, escrowedCount } = await processGhostBookingsPenalties();

		return NextResponse.json({
			success: true,
			staleCancelled: cancelledCount,
			ghostWarnings: warningsSent,
			ghostEscrowed: escrowedCount,
			message: `Stale: ${cancelledCount}, Warnings: ${warningsSent}, Escrowed: ${escrowedCount}`,
		});
	} catch (error) {
		console.error("Error in cleanup cron:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
