import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bookingDetailsInclude, type DetailedBooking } from '@/lib/types';
import { redirect } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { sanitizePrismaData } from '@/lib/utils';
import AdminBookingsList from '@/components/shared/AdminBookingsList';

export default async function AdminBookingsPage() {
  const session = await auth();
  if (!session) redirect('/login');


  const bookings: DetailedBooking[] = await prisma.booking.findMany({
    include: bookingDetailsInclude,
    orderBy: { createdAt: 'desc' },
  });

  const sanitizedBookings = sanitizePrismaData(bookings);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">إدارة كل الحجوزات</h1>
        <p className="text-xs text-muted-foreground">
          عرض ومتابعة كافة المواعيد والطلبات المسجلة في المنصة وإدارتها أو إلغائها عند الضرورة.
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
