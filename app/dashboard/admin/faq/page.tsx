import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getFAQs } from '@/lib/actions/faq';
import FAQAdminClient from './FAQAdminClient';

export const metadata: Metadata = {
  title: 'إدارة الأسئلة الشائعة | منصة إديونست',
  description: 'إدارة الأسئلة الشائعة لجميع أنواع المستخدمين',
};

export default async function AdminFAQPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const res = await getFAQs(undefined, true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">إدارة الأسئلة الشائعة</h1>
        <p className="text-xs text-muted-foreground">
          يمكنك هنا إضافة، تعديل، وحذف الأسئلة الشائعة الخاصة بأولياء الأمور، المعلمين، والإدارة.
        </p>
      </div>

      {!res.success ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {res.error || 'حدث خطأ أثناء جلب البيانات'}
        </div>
      ) : (
        <FAQAdminClient initialFaqs={res.data || []} />
      )}
    </div>
  );
}
