import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bookingDetailsInclude, type DetailedBooking } from '@/lib/types';
import { redirect } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { sanitizePrismaData } from '@/lib/utils';
import ParentBookingsList from '@/components/shared/ParentBookingsList';

export default async function ParentBookingsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.user.id;

  const bookings: DetailedBooking[] = await prisma.booking.findMany({
    where: { parentUserId: userId },
    include: bookingDetailsInclude,
    orderBy: { createdAt: 'desc' },
  });

  const sanitizedBookings = sanitizePrismaData(bookings);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">حجوزاتي وجلساتي</h1>
        <p className="text-xs text-muted-foreground">
          تابع مواعيد الحصص المجدولة للطلاب، التقاير التعليمية المرفوعة من المعلمين بعد الدروس، وتقييم الجلسات.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="font-extrabold text-base border-b border-border pb-2.5 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          سجل الحصص والطلبات
        </h2>

        <ParentBookingsList bookings={sanitizedBookings} />
      </div>
    </div>
  );
}
