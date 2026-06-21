import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getFAQs } from '@/lib/actions/faq';
import { FAQCategory } from '@prisma/client';
import FAQAccordion from '@/components/shared/FAQAccordion';
import NajeebCharacter from '@/components/shared/NajeebCharacter';

export const metadata: Metadata = {
  title: 'الأسئلة الشائعة | منصة إديونست',
  description: 'الأسئلة الشائعة لأولياء الأمور',
};

export default async function ParentFAQPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const res = await getFAQs(FAQCategory.PARENT);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-2xl font-black mb-1">الأسئلة الشائعة</h1>
        <p className="text-xs text-muted-foreground">
          تجد هنا إجابات لأكثر الأسئلة شيوعاً حول استخدام المنصة، الحجوزات، والمدفوعات الخاصة بأولياء الأمور.
        </p>
      </div>

      {!res.success ? (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl border border-red-200/50">
          {res.error || 'حدث خطأ أثناء جلب البيانات'}
        </div>
      ) : (
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-premium relative overflow-visible mt-12">
          {/* نجيب يخرج رأسه من خلف بطاقة الأسئلة الشائعة (ثابت بدون حركة) */}
          <div className="absolute -top-14 left-6 z-0">
            <NajeebCharacter mode="help" size="sm" animated={false} />
          </div>
          <div className="relative z-10">
            <FAQAccordion faqs={res.data || []} />
          </div>
        </div>
      )}
    </div>
  );
}
