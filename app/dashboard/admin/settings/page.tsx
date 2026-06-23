import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminSettingsForm from '@/components/shared/AdminSettingsForm';

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session) redirect('/login');


  const settings = await prisma.systemSetting.findMany({
    orderBy: { settingKey: 'asc' },
  });

  return <AdminSettingsForm initialSettings={settings} />;
}
