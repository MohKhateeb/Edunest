import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AddStudentForm from '@/components/shared/AddStudentForm';
import ParentStudentsList from '@/components/shared/ParentStudentsList';
import { Users } from 'lucide-react';
import InteractiveMessage from '@/components/shared/InteractiveMessage';
import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';

export default async function ParentStudentsPage() {
  const session = await auth();
  await requireAuth([UserType.PARENT]);
  if (!session) redirect('/login');

  const userId = session.user.id;

  const students = await prisma.student.findMany({
    where: { parentUserId: userId, isActive: true },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8 text-right pb-10" dir="rtl">
      <div>
        <h1 className="text-2xl font-black mb-4 text-primary">أبطال المستقبل (إدارة الأبناء)</h1>
        <InteractiveMessage 
          character="hakeem"
          message="إضافة بيانات أبنائك وتحديث مستوياتهم الدراسية بدقة، هي الخطوة الأولى لاختيار المعلم الأنسب وتخصيص تجربة التعلم لكل بطل منهم."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Students List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-black text-lg border-b border-border/50 pb-3 flex items-center gap-2">
              <Users className="h-6 w-6 text-secondary" />
              أبطالنا المضافين حالياً
            </h2>

            <ParentStudentsList students={students} />
          </div>
        </div>

        {/* Add Student Form with Najeeb inside Content */}
        <div className="space-y-6 lg:mt-0">
          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-1 shadow-sm">
             <AddStudentForm />
          </div>

          <InteractiveMessage 
            character="najeeb"
            najeebMode="study"
            message="كلما أضفنا بطلاً جديداً لعائلتنا هنا، زادت فرصتنا في تحقيق التفوق والنجاح معاً! 🌟"
          />
        </div>
      </div>
    </div>
  );
}
