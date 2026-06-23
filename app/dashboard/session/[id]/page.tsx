import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SessionLobbyClient from '@/components/shared/SessionLobbyClient';

export default async function SessionLobbyPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id: bookingId } = await params;

  // Fetch the booking details
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: true,
      teacherService: {
        include: { 
          teacher: { include: { user: true } },
          serviceType: true
        }
      }
    }
  });

  if (!booking) {
    console.log(`SessionLobbyPage: Booking not found for id ${bookingId}. Redirecting to /dashboard`);
    redirect('/dashboard');
  }

  // Ensure only the parent or the teacher can view this room
  const isParent = session.user.userType === 'PARENT' && booking.parentUserId === session.user.id;
  const isTeacher = session.user.userType === 'TEACHER' && booking.teacherService.teacher.userId === session.user.id;

  if (!isParent && !isTeacher) {
    console.log(`SessionLobbyPage: Unauthorized access for user ${session.user.id} to booking ${bookingId}. Redirecting to /unauthorized`);
    redirect('/unauthorized');
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10" dir="rtl">
      <SessionLobbyClient 
        bookingId={booking.id}
        isParent={isParent}
        paymentStatus={booking.paymentStatus}
        meetingUrl={booking.meetingUrl}
        teacherName={booking.teacherService.teacher.user.name || 'المعلم'}
        studentName={booking.student.name || 'الطالب'}
        subject={booking.teacherService.serviceType.name}
        price={Number(booking.price)}
      />
    </div>
  );
}
