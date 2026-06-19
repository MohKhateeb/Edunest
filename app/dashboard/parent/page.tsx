import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Users, Bell, CalendarPlus, CheckCircle, Clock } from 'lucide-react';
import { formatLocalTime } from '@/lib/utils';
import NajeebCharacter from '@/components/shared/NajeebCharacter';
import HakeemCharacter from '@/components/shared/HakeemCharacter';

export default async function ParentDashboard() {
  const session = await auth();
  if (!session) redirect('/login');

  const userId = session.user.id;

  // Fetch counts
  const studentCount = await prisma.student.count({
    where: { parentUserId: userId, isActive: true },
  });

  const upcomingBookingsCount = await prisma.booking.count({
    where: {
      parentUserId: userId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      startTime: { gte: new Date() },
    },
  });

  // Fetch notifications
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Fetch next upcoming session
  const nextSession = await prisma.booking.findFirst({
    where: {
      parentUserId: userId,
      status: 'CONFIRMED',
      startTime: { gte: new Date() },
    },
    include: {
      student: true,
      teacherService: {
        include: {
          serviceType: true,
          teacher: {
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { startTime: 'asc' },
  });

  // Fetch students of this parent to calculate weekly stats
  const students = await prisma.student.findMany({
    where: { parentUserId: userId, isActive: true },
    select: { id: true, name: true }
  });
  const studentIds = students.map(s => s.id);

  // Fetch completed bookings and reports to calculate Hakeem's Weekly Summary
  const completedBookings = await prisma.booking.findMany({
    where: {
      studentId: { in: studentIds },
      status: 'COMPLETED'
    },
    include: {
      student: true,
      report: true,
      teacherService: {
        include: {
          serviceType: true,
          teacher: {
            include: { user: { select: { name: true } } }
          }
        }
      }
    },
    orderBy: { startTime: 'desc' }
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Filter completed bookings in the last 7 days, fallback to all-time if empty
  let weeklyBookings = completedBookings.filter(b => b.startTime >= sevenDaysAgo);
  let isWeekly = true;

  if (weeklyBookings.length === 0 && completedBookings.length > 0) {
    weeklyBookings = completedBookings;
    isWeekly = false;
  }

  // Calculate statistics
  const totalMinutes = weeklyBookings.reduce((sum, b) => sum + b.duration, 0);
  const studyHours = (totalMinutes / 60).toFixed(1);

  const totalHomeworkAssigned = weeklyBookings.filter(b => b.report?.homeworkAssigned && b.report.homeworkAssigned.toLowerCase() !== 'no' && b.report.homeworkAssigned.toLowerCase() !== 'none' && b.report.homeworkAssigned.trim() !== '').length;
  
  let homeworkCompleted = 0;
  let homeworkTotal = 0;

  if (totalHomeworkAssigned > 0) {
    homeworkTotal = totalHomeworkAssigned;
    homeworkCompleted = weeklyBookings.filter(b => b.report?.homeworkAssigned && b.report.homeworkAssigned.toLowerCase() !== 'no' && b.report.studentPerformance && b.report.studentPerformance >= 3).length;
  } else {
    // Fallback based on completed sessions and performance
    homeworkTotal = weeklyBookings.length;
    homeworkCompleted = weeklyBookings.filter(b => b.report?.studentPerformance && b.report.studentPerformance >= 4).length;
  }

  const ratings = weeklyBookings.map(b => b.report?.studentPerformance).filter((r): r is number => typeof r === 'number');
  const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1) : '5.0';

  // Hakeem Recommendation Logic
  let recommendation = '';
  const latestBooking = completedBookings[0];
  if (latestBooking && latestBooking.report) {
    const report = latestBooking.report;
    const studentName = latestBooking.student.name;
    const teacherName = latestBooking.teacherService.teacher.user.name;
    const subjectName = latestBooking.teacherService.serviceType.name;
    
    if (report.teacherNotes && report.teacherNotes.trim() !== '') {
      recommendation = `«ينصح المعلم ${teacherName} بالتركيز على: "${report.teacherNotes}" لمساعدة ${studentName} في الجلسات القادمة.»`;
    } else if (report.homeworkAssigned && report.homeworkAssigned.trim() !== '' && report.homeworkAssigned.toLowerCase() !== 'no') {
      recommendation = `«يرجى حثّ ${studentName} على إكمال واجب: "${report.homeworkAssigned}" استعداداً للجلسة القادمة.»`;
    } else {
      recommendation = `«أنهى ${studentName} جلسة ${subjectName} بنجاح مع المعلم ${teacherName}. يوصي الحكيم بالاستمرار في المراجعة المنتظمة.»`;
    }
  } else if (students.length > 0) {
    const firstStudentName = students[0].name;
    recommendation = `«أهلاً بك يا ${session.user.name}. يرجى حجز الجلسة الأولى أو التجريبية لـ ${firstStudentName} لبدء رحلته التعليمية مع معلمينا الموثوقين!»`;
  } else {
    recommendation = `«أهلاً بك في منصة إيدونِست! الخطوة الأولى هي إضافة طلابك من صفحة "إدارة الطلاب" لتتمكن من حجز الجلسات لهم.»`;
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Welcome banner with overflow-visible peeking Najeeb (Static) */}
      <div className="relative mt-6 lg:mt-12 bg-gradient-to-r from-amber-100 via-orange-100 to-pink-100 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-pink-950/20 border border-orange-200/30 dark:border-orange-900/10 rounded-3xl p-6 text-slate-800 dark:text-slate-100 shadow-premium flex justify-between items-center flex-wrap gap-4 overflow-visible min-h-[140px]">
        <div className="z-10 flex-1 min-w-[200px] space-y-2">
          <h1 className="text-2xl font-black mb-1 text-slate-900 dark:text-white">أهلاً بك، {session.user.name} 👋</h1>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">من لوحة التحكم يمكنك إدارة الطلاب ومتابعة الحجوزات مع المعلمين.</p>
          <div className="pt-2">
            <Link
              href="/dashboard/parent/bookings/new"
              className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <CalendarPlus className="h-4.5 w-4.5" />
              حجز جلسة جديدة
            </Link>
          </div>
        </div>
        {/* نجيب يخرج رأسه من خلف البانر الترحيبي (ثابت بدون حركة) */}
        <div className="relative lg:absolute lg:left-12 lg:-top-10 flex-shrink-0 z-20">
          <NajeebCharacter mode="welcome" size="lg" animated={false} className="h-32 w-32 md:h-36 md:w-36 lg:h-40 lg:w-40" />
        </div>
      </div>

      {/* Hakeem's Weekly Summary Card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-premium relative overflow-hidden bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/10">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <HakeemCharacter size="sm" className="w-10 h-10 shrink-0" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">الملخص الأسبوعي من الحكيم</h2>
            </div>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              أداء ممتع وإيجابي من أبنائك {isWeekly ? 'هذا الأسبوع' : 'مؤخراً'}! إليك تفاصيل التقدم الدراسي والواجبات المنجزة.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs">
              <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                ⏳ ساعات الدراسة: {studyHours} ساعة
              </span>
              <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
                📝 الواجبات: {homeworkCompleted}/{homeworkTotal} منجزة
              </span>
              <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold px-3 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">
                ⭐ التقييم العام: {avgRating}/5
              </span>
            </div>
          </div>
          <div className="w-full md:w-auto bg-slate-50 dark:bg-slate-800/60 border border-border/80 rounded-2xl p-4 md:max-w-xs text-xs font-bold leading-relaxed shadow-sm shrink-0">
            <p className="text-indigo-600 dark:text-indigo-400 mb-1">💡 توصية الحكيم الأسبوعية:</p>
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              {recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border/80 rounded-3xl p-5 flex items-center gap-4 shadow-premium hover:shadow-md transition-all">
          <div className="p-3.5 bg-primary/10 rounded-2xl text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-bold">الطلاب المسجلين</span>
            <span className="text-2xl font-black text-foreground">{studentCount} طلاب</span>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-3xl p-5 flex items-center gap-4 shadow-premium hover:shadow-md transition-all">
          <div className="p-3.5 bg-blue-500/10 text-blue-600 rounded-2xl">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block font-bold">الجلسات القادمة</span>
            <span className="text-2xl font-black text-foreground">{upcomingBookingsCount} جلسات</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Session Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-premium space-y-4">
            <h2 className="font-black text-base border-b border-border/60 pb-2.5">الجلسة القادمة المؤكدة</h2>
            {nextSession ? (
              <div className="bg-accent/40 rounded-2xl p-4 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-accent border border-border flex-shrink-0">
                    {nextSession.teacherService.teacher.profileImageUrl ? (
                      <img
                        src={nextSession.teacherService.teacher.profileImageUrl}
                        alt={nextSession.teacherService.teacher.user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-primary font-bold text-lg bg-primary/10">
                        {nextSession.teacherService.teacher.user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <h3 className="font-bold text-foreground text-sm">
                      {nextSession.teacherService.serviceType.name}
                    </h3>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{formatLocalTime(nextSession.startTime)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      المعلم: <strong className="text-foreground">{nextSession.teacherService.teacher.user.name}</strong> |
                      الطالب: <strong className="text-foreground">{nextSession.student.name}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 self-end sm:self-center">
                  <a
                    href={`https://meet.jit.si/edunest-${nextSession.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    انضم للجلسة (Jitsi Meet)
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-6 text-center">
                لا توجد جلسات مؤكدة قادمة مجدولة حالياً.
              </p>
            )}
          </div>
        </div>

        {/* Notifications Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-premium space-y-4">
            <h2 className="font-black text-base border-b border-border/60 pb-2.5 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              آخر الإشعارات
            </h2>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  لا توجد إشعارات جديدة.
                </p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-3 bg-accent/20 rounded-xl border border-border/40 text-xs">
                    <div className="font-bold text-foreground/80 mb-1">{n.title}</div>
                    <p className="text-muted-foreground leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-muted-foreground/60 block mt-1.5">
                      {new Date(n.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* بطاقة نجيب التفاعلية المدمجة في محتوى الصفحة */}
          <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-premium flex items-center gap-4 text-right">
            <div className="shrink-0 bg-primary/5 rounded-2xl p-1 border border-primary/10">
              <NajeebCharacter mode="study" size="sm" animated={false} />
            </div>
            <div className="space-y-1.5">
              <span className="inline-block bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-full">
                💡 إرشادات نجيب
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
                «متابعة تقارير الحصص بانتظام ومناقشة الواجبات مع طفلك يساعدان في تحسين فهمه بنسبة 40%.»
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
