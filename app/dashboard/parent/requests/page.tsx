import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTutoringRequestsForParent } from '@/lib/actions/tutoring-request';
import ParentRequestsList from '@/components/shared/ParentRequestsList';
import { Briefcase } from 'lucide-react';
import InteractiveMessage from '@/components/shared/InteractiveMessage';

export default async function ParentRequestsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const res = await getTutoringRequestsForParent();
  const requests = res.success && res.data ? res.data : [];
  
  const pendingCount = requests.filter((r: any) => r.status === 'PENDING').length;
  const acceptedCount = requests.filter((r: any) => r.status === 'ACCEPTED').length;
  const totalOffersCount = requests.reduce((acc: number, r: any) => acc + r.offers.length, 0);

  const najeebMsg = pendingCount > 0 
    ? `لديك ${pendingCount} طلبات بانتظار العروض! نحن نتواصل مع أفضل المعلمين الآن لتوفير الخيار الأنسب لك.`
    : "هنا يمكنك متابعة طلباتك العامة واختيار المعلم الأنسب لعروض الأسعار التي تصلك. هل أنت مستعد للبدء؟";

  return (
    <div className="space-y-6" dir="rtl">
      {/* Hero Section */}
      <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent rounded-[2rem] p-6 sm:p-8 border border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="space-y-4 max-w-xl">
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3" suppressHydrationWarning>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-border/50 text-primary">
                <Briefcase className="h-7 w-7" />
              </div>
              الطلبات العامة للدروس
            </h1>
            <InteractiveMessage 
              character="najeeb"
              najeebMode={pendingCount > 0 ? "study" : "welcome"}
              message={najeebMsg}
              className="mt-2"
            />
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl p-4 flex-1 md:w-32 shadow-sm text-center">
              <span className="block text-3xl font-black text-primary mb-1">{pendingCount}</span>
              <span className="text-xs font-bold text-muted-foreground">طلبات نشطة</span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl p-4 flex-1 md:w-32 shadow-sm text-center">
              <span className="block text-3xl font-black text-emerald-600 mb-1">{acceptedCount}</span>
              <span className="text-xs font-bold text-muted-foreground">طلبات منجزة</span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-slate-700/50 rounded-2xl p-4 flex-1 md:w-32 shadow-sm text-center">
              <span className="block text-3xl font-black text-violet-600 mb-1">{totalOffersCount}</span>
              <span className="text-xs font-bold text-muted-foreground">عروض مستلمة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative">
        <ParentRequestsList requests={requests} />
      </div>
    </div>
  );
}
