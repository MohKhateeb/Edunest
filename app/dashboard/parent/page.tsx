import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Users, Bell, CalendarPlus, CheckCircle, Clock } from 'lucide-react';
import { formatLocalTime } from '@/lib/utils';
import InteractiveMessage from '@/components/shared/InteractiveMessage';
import { getParentDashboardInsights } from '@/lib/services/parent-dashboard';

export default async function ParentDashboard() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.user.id;
  const userName = session.user.name || 'ولي الأمر';

  // Fetch clean data from our service
  const insights = await getParentDashboardInsights(userId, userName);

  return (
    <div className="space-y-8 text-right pb-10" dir="rtl">
      
      {/* قسم الترحيب ونجيب */}
      <div className="mt-4">
        <InteractiveMessage 
          character="najeeb"
          title={`أهلاً بك، ${userName} 👋`}
          message={insights.najeebMessage}
          najeebMode={insights.najeebMode}
          className="lg:w-3/4"
        />
        <div className="mt-6 pr-4 sm:pr-20">
          <Link
            href="/dashboard/parent/bookings/new"
            className="inline-flex items-center gap-2 bg-gradient-to-l from-primary to-blue-400 text-white hover:shadow-lg hover:scale-105 px-6 py-3 rounded-2xl text-sm font-black shadow-md transition-all cursor-pointer animate-pulse-soft"
          >
            <CalendarPlus className="h-5 w-5" />
            حجز جلسة جديدة
          </Link>
        </div>
      </div>

      {/* قسم موجز الحكيم */}
      <div className="pt-2 border-t border-border/50">
        <InteractiveMessage 
          character="hakeem"
          title="موجز الحكيم"
          message={insights.hakeemMessage}
        />
        
        {/* إحصائيات داعمة للحكيم */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
            <span className="text-3xl font-black text-primary mb-1">{insights.stats.studentCount}</span>
            <span className="text-xs text-muted-foreground font-bold">عدد الأبناء</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
            <span className="text-3xl font-black text-secondary mb-1">{insights.stats.upcomingBookingsCount}</span>
            <span className="text-xs text-muted-foreground font-bold">جلسات قادمة</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
            <span className="text-3xl font-black text-accent-2 mb-1">{insights.stats.studyHours}</span>
            <span className="text-xs text-muted-foreground font-bold">ساعات الدراسة</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
            <span className="text-3xl font-black text-amber-500 mb-1">{insights.stats.avgRating}/5</span>
            <span className="text-xs text-muted-foreground font-bold">متوسط التقييم</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-border/50">
        
        {/* Next Session Panel */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-black text-lg flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            الجلسة القادمة المؤكدة
          </h2>
          
          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
            {insights.nextSession ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-primary/10 border border-primary/20 flex-shrink-0">
                    {insights.nextSession.teacherService.teacher.profileImageUrl ? (
                      <img
                        src={insights.nextSession.teacherService.teacher.profileImageUrl}
                        alt={insights.nextSession.teacherService.teacher.user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-primary font-black text-2xl">
                        {insights.nextSession.teacherService.teacher.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-foreground text-lg">
                      {insights.nextSession.teacherService.serviceType.name}
                    </h3>
                    <div className="text-sm text-muted-foreground font-semibold flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full w-fit">
                      <Clock className="h-4 w-4 text-secondary" />
                      <span>{formatLocalTime(insights.nextSession.startTime)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pt-1 font-medium">
                      المعلم: <strong className="text-foreground">{insights.nextSession.teacherService.teacher.user.name}</strong> • 
                      الطالب: <strong className="text-foreground">{insights.nextSession.student.name}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 self-end sm:self-center">
                  <a
                    href={`https://meet.jit.si/edunest-${insights.nextSession.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold bg-accent-2 text-white hover:bg-emerald-600 px-5 py-3 rounded-2xl shadow-md transition-all hover:-translate-y-1"
                  >
                    انضم للجلسة الآن
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground font-semibold">
                  لا توجد جلسات مؤكدة قادمة مجدولة حالياً.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Sidebar */}
        <div className="space-y-4">
          <h2 className="font-black text-lg flex items-center gap-2">
            <Bell className="h-6 w-6 text-secondary" />
            آخر الإشعارات
          </h2>
          
          <div className="bg-white dark:bg-slate-900 border border-border/80 rounded-3xl p-5 shadow-sm space-y-3">
            {insights.notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center font-semibold">
                لا توجد إشعارات جديدة.
              </p>
            ) : (
              insights.notifications.map((n) => (
                <div key={n.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-border/50 transition-all hover:border-primary/30">
                  <div className="font-black text-foreground mb-1 text-sm">{n.title}</div>
                  <p className="text-muted-foreground leading-relaxed text-xs font-medium">{n.message}</p>
                  <span className="text-[10px] text-muted-foreground/60 block mt-2 font-bold">
                    {new Date(n.createdAt).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
