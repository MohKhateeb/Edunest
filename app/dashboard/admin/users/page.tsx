import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminUsersList from '@/components/shared/AdminUsersList';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) redirect('/login');

  // Fetch all users with related students and teacher profile details
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      userType: true,
      isActive: true,
      createdAt: true,
      students: {
        select: {
          id: true,
          name: true,
          grade: true,
          school: true,
        },
      },
      teacher: {
        select: {
          id: true,
          subjects: { include: { subject: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">إدارة مستخدمي المنصة</h1>
        <p className="text-xs text-muted-foreground">
          عرض جميع الحسابات المسجلة في المنصة بمختلف أنواعها، وتعديل حالات النشاط وتفاصيل الأبناء التابعين لكل ولي أمر.
        </p>
      </div>

      <AdminUsersList users={users} />
    </div>
  );
}
