import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import TeacherProfileForm from '@/components/shared/TeacherProfileForm';
import TeacherSlugForm from '@/components/shared/TeacherSlugForm';

export default async function TeacherProfilePage() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.user.id;

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });

  const initialData = {
    specialization: teacher?.specialization || '',
    subSpecialization: teacher?.subSpecialization || null,
    bio: teacher?.bio || null,
    gradeLevels: teacher?.gradeLevels || [],
    city: teacher?.city || null,
    area: teacher?.area || null,
    education: teacher?.education || null,
    yearsOfExperience: teacher?.yearsOfExperience ?? 0,
    defaultHourlyRate: teacher?.defaultHourlyRate ? Number(teacher.defaultHourlyRate) : 50,
    profileImageUrl: teacher?.profileImageUrl || null,
  };

  return (
    <div className="space-y-8">
      {teacher && (
        <TeacherSlugForm 
          currentSlug={teacher.slug} 
          slugUpdated={teacher.slugUpdated} 
        />
      )}
      <TeacherProfileForm initialData={initialData} />
    </div>
  );
}
