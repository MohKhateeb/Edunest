import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminTeachersList from '@/components/shared/AdminTeachersList';
import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';

export default async function AdminTeachersPage() {
  const session = await auth();
  await requireAuth([UserType.ADMIN]);
  if (!session) redirect('/login');


  // Fetch teachers
  const teachers = await prisma.teacher.findMany({
    select: {
      id: true,
      subjects: { include: { subject: true } },
      isVerified: true,
      verificationLevel: true,
      averageRating: true,
      totalReviews: true,
      profileImageUrl: true,
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { user: { name: 'asc' } },
  });

  const mappedTeachers = teachers.map((t) => ({
    id: t.id,
    specialization: t.subjects?.map(s => s.subject.name).join(', ') || 'غير محدد',
    isVerified: t.isVerified,
    verificationLevel: t.verificationLevel,
    averageRating: Number(t.averageRating),
    totalReviews: t.totalReviews,
    profileImageUrl: t.profileImageUrl,
    user: t.user,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">إدارة معلمي المنصة</h1>
        <p className="text-xs text-muted-foreground">
          عرض قائمة المعلمين المسجلين في المنصة، التحكم في مستويات التوثيق الممنوحة وتفعيل الحسابات يدوياً.
        </p>
      </div>

      <AdminTeachersList teachers={mappedTeachers} />
    </div>
  );
}
