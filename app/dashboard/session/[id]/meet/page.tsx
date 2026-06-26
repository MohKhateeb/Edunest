import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import JitsiMeetingRoom from '@/components/shared/JitsiMeetingRoom';
import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';

export default async function SessionMeetPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  await requireAuth([UserType.ADMIN, UserType.TEACHER, UserType.PARENT]);
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
    redirect('/dashboard');
  }

  // Ensure only the parent or the teacher can view this room
  const isParent = session.user.userType === 'PARENT' && booking.parentUserId === session.user.id;
  const isTeacher = session.user.userType === 'TEACHER' && booking.teacherService.teacher.userId === session.user.id;

  if (!isParent && !isTeacher) {
    redirect('/unauthorized');
  }

  // Ensure the booking is confirmed before joining
  if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') {
    // If not confirmed (e.g. pending payment), send them to lobby
    redirect(`/dashboard/session/${bookingId}`);
  }

  const role = isTeacher ? 'TEACHER' : 'PARENT';
  const userName = isTeacher ? booking.teacherService.teacher.user.name || 'معلم' : booking.student.name || 'طالب';
  const roomName = booking.meetingUrl ? new URL(booking.meetingUrl).pathname.slice(1) : `edunest-${booking.id}`;

  return (
    <JitsiMeetingRoom
      roomName={roomName}
      userName={userName}
      bookingId={booking.id}
      role={role}
      startTime={booking.startTime}
      durationMinutes={booking.duration}
    />
  );
}
