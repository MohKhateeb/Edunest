import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { bookingDetailsInclude, type DetailedBooking } from '@/lib/types';
import { redirect } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { sanitizePrismaData } from '@/lib/utils';
import TeacherBookingsList from '@/components/shared/TeacherBookingsList';

export default async function TeacherBookingsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.user.id;

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });

  if (!teacher) {
    redirect('/dashboard/teacher');
  }

  const bookings: DetailedBooking[] = await prisma.booking.findMany({
    where: {
      teacherService: {
        teacherId: teacher.id,
      },
    },
    include: bookingDetailsInclude,
    orderBy: { createdAt: 'desc' },
  });

  const sanitizedBookings = sanitizePrismaData(bookings);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">جدول الحصص والطلبات الواردة</h1>
        <p className="text-xs text-muted-foreground">
          تابع مواعيد الحصص المجدولة للطلاب، قبول/رفض طلبات الحجز المعلقة، ورفع تقارير الأداء بعد انتهاء الحصص.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="font-extrabold text-base border-b border-border pb-2.5 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          سجل الحصص الواردة
        </h2>

        <TeacherBookingsList bookings={sanitizedBookings} />
      </div>
    </div>
  );
}
