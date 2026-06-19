import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import TeacherVerificationForm from '@/components/shared/TeacherVerificationForm';

export default async function TeacherVerificationPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.user.id;

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: { verification: true },
  });

  if (!teacher) {
    redirect('/dashboard/teacher');
  }

  const initialData = teacher.verification
    ? {
        nationalIdUrl: teacher.verification.nationalIdUrl,
        degreeUrl: teacher.verification.degreeUrl,
        videoInterviewUrl: teacher.verification.videoInterviewUrl,
        reviewedAt: teacher.verification.reviewedAt,
        rejectionReason: teacher.verification.rejectionReason,
      }
    : null;

  return (
    <TeacherVerificationForm
      initialData={initialData}
      isVerified={teacher.isVerified}
    />
  );
}
