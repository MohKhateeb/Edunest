import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminServiceTypesManager from '@/components/shared/AdminServiceTypesManager';
import { requireAuth } from '@/lib/require-auth';
import { UserType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function AdminServiceTypesPage() {
  const session = await auth();
  await requireAuth([UserType.ADMIN]);
  if (!session || session.user.userType !== 'ADMIN') {
    redirect('/login');
  }

  const serviceTypes = await prisma.serviceType.findMany({
    orderBy: { displayOrder: 'asc' }
  });

  // Convert Decimal to numbers for the client component
  const formattedServices = serviceTypes.map(st => ({
    id: st.id,
    name: st.name,
    nameEnglish: st.nameEnglish,
    defaultDuration: st.defaultDuration,
    commissionRate: Number(st.commissionRate),
    isRecurring: st.isRecurring,
    isActive: st.isActive,
    fazaaPrice: st.fazaaPrice ? Number(st.fazaaPrice) : null,
    fazaaDuration: st.fazaaDuration,
  }));

  return <AdminServiceTypesManager initialServices={formattedServices} />;
}
