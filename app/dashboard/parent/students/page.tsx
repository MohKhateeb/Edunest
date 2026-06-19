import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AddStudentForm from '@/components/shared/AddStudentForm';
import ParentStudentsList from '@/components/shared/ParentStudentsList';
import { Users } from 'lucide-react';
import NajeebCharacter from '@/components/shared/NajeebCharacter';

export default async function ParentStudentsPage() {
  const session = await auth();
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
    <div className="space-y-6 text-right" dir="rtl">
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-2xl font-black mb-1">إدارة الطلاب</h1>
        <p className="text-xs text-muted-foreground">
          أضف بيانات أبنائك الطلاب لتتمكن من حجز جلسات تعليمية تناسب مستوياتهم الدراسية.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Students List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-extrabold text-base border-b border-border pb-2.5 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              الطلاب المضافين حالياً
            </h2>

            <ParentStudentsList students={students} />
          </div>
        </div>

        {/* Add Student Form with Najeeb inside Content */}
        <div className="space-y-6 mt-12 lg:mt-0">
          <AddStudentForm />

          {/* بطاقة إرشادية مدمجة لشخصية نجيب في المحتوى */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-premium flex items-center gap-4 text-right">
            <div className="shrink-0 bg-primary/5 rounded-2xl p-1 border border-primary/10">
              <NajeebCharacter mode="study" size="sm" animated={false} />
            </div>
            <div className="space-y-1.5">
              <span className="inline-block bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-[10px] font-black px-2.5 py-1 rounded-full">
                💡 إرشاد من نجيب
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                «إضافة بيانات الطالب (الاسم، الصف، المدرسة) بدقة تساعدنا في ترشيح أنسب المعلمين الموثوقين له.»
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
