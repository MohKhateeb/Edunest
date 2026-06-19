import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getFAQs } from '@/lib/actions/faq';
import { FAQCategory } from '@prisma/client';
import FAQAccordion from '@/components/shared/FAQAccordion';

export const metadata: Metadata = {
  title: 'الأسئلة الشائعة | منصة إيدونست',
  description: 'الأسئلة الشائعة للمعلمين',
};

export default async function TeacherFAQPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const res = await getFAQs(FAQCategory.TEACHER);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">الأسئلة الشائعة</h1>
        <p className="text-xs text-muted-foreground">
          تجد هنا إجابات لأكثر الأسئلة شيوعاً حول إدارة الحساب، الحجوزات، والأمور المالية الخاصة بالمعلمين.
        </p>
      </div>

      {!res.success ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {res.error || 'حدث خطأ أثناء جلب البيانات'}
        </div>
      ) : (
        <FAQAccordion faqs={res.data || []} />
      )}
    </div>
  );
}
