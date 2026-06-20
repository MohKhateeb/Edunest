import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAvailableRequestsForTeacher } from '@/lib/actions/tutoring-request';
import TeacherRequestsList from '@/components/shared/TeacherRequestsList';
import { CalendarPlus } from 'lucide-react';

export default async function TeacherRequestsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  // 1. جلب بيانات المعلم الحالي
  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isAvailableNow: true, isVerified: true },
  });

  if (!teacher) {
    return (
      <div className="p-6 text-center space-y-4" dir="rtl">
        <h1 className="text-xl font-bold text-rose-500">غير مصرح بالدخول</h1>
        <p className="text-sm text-muted-foreground">حسابك لا يبدو مسجلاً كمعلم في النظام.</p>
      </div>
    );
  }

  // 2. التحقق من التوثيق
  if (!teacher.isVerified) {
    return (
      <div className="max-w-2xl mx-auto bg-card border border-border p-8 rounded-2xl text-center space-y-4 my-10" dir="rtl">
        <div className="mx-auto w-16 h-16 bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center">
          <CalendarPlus className="h-10 w-10 animate-pulse" />
        </div>
        <h2 className="text-xl font-extrabold text-yellow-600 dark:text-yellow-400">حسابك قيد التوثيق أو غير موثق بعد</h2>
        <p className="text-sm text-muted-foreground">
          لتتمكن من تصفح طلبات التدريس العامة وتقديم عروض أسعار للطلاب، يجب أن يوثق المسؤولون حسابك أولاً. يرجى إكمال رفع الوثائق المطلوبة في صفحة "رفع وثائق التوثيق".
        </p>
      </div>
    );
  }

  // 3. جلب الطلبات المتوافقة وعروض المعلم
  const res = await getAvailableRequestsForTeacher();
  
  const availableRequests = res.success && res.data?.availableRequests ? res.data.availableRequests : [];
  const myOffers = res.success && res.data?.myOffers ? res.data.myOffers : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">طلبات التدريس العامة المتاحة</h1>
        <p className="text-xs text-muted-foreground">
          تصفح طلبات الطلاب وأولياء الأمور المفتوحة لمادتك وصفوفك الدراسية، وقدم عرض سعر مناسب لتبدأ الجلسة.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="font-extrabold text-base border-b border-border pb-2.5 flex items-center gap-2" dir="rtl">
          <CalendarPlus className="h-5 w-5 text-primary" />
          لوحة طلبات التدريس وعروض الأسعار
        </h2>

        <TeacherRequestsList
          teacherId={teacher.id}
          initialIsAvailable={teacher.isAvailableNow}
          availableRequests={availableRequests}
          myOffers={myOffers}
        />
      </div>
    </div>
  );
}
