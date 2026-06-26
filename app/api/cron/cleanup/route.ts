import { NextResponse } from 'next/server';
import { processStaleBookingsCancellation } from '@/lib/services/booking-cleanup';

export async function GET(request: Request) {
  // الحماية: يجب التأكد من أن المستدعي هو خدمة الـ Cron (مثلاً Vercel Cron) 
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // التنظيف الشامل لجميع الجلسات المعلقة المنتهية في النظام (Dry & SOLED)
    const cancelledCount = await processStaleBookingsCancellation();

    return NextResponse.json({
      success: true,
      count: cancelledCount,
      message: `Successfully cancelled ${cancelledCount} stale bookings.`,
    });
  } catch (error) {
    console.error('Error in cleanup cron:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
