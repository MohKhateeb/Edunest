import { prisma } from '@/lib/prisma';

export type DashboardInsights = {
  hakeemMessage: string;
  najeebMessage: string;
  najeebMode: 'welcome' | 'study' | 'success' | 'help';
  stats: {
    studentCount: number;
    upcomingBookingsCount: number;
    studyHours: string;
    homeworkCompleted: number;
    homeworkTotal: number;
    avgRating: string;
    isWeekly: boolean;
  };
  nextSession: any | null;
  notifications: any[];
};

export async function getParentDashboardInsights(userId: string, userName: string): Promise<DashboardInsights> {
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

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

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

  const students = await prisma.student.findMany({
    where: { parentUserId: userId, isActive: true },
    select: { id: true, name: true }
  });
  const studentIds = students.map(s => s.id);

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

  let weeklyBookings = completedBookings.filter(b => b.startTime >= sevenDaysAgo);
  let isWeekly = true;

  if (weeklyBookings.length === 0 && completedBookings.length > 0) {
    weeklyBookings = completedBookings;
    isWeekly = false;
  }

  const totalMinutes = weeklyBookings.reduce((sum, b) => sum + b.duration, 0);
  const studyHours = (totalMinutes / 60).toFixed(1);

  const totalHomeworkAssigned = weeklyBookings.filter(b => b.report?.homeworkAssigned && b.report.homeworkAssigned.toLowerCase() !== 'no' && b.report.homeworkAssigned.toLowerCase() !== 'none' && b.report.homeworkAssigned.trim() !== '').length;
  
  let homeworkCompleted = 0;
  let homeworkTotal = 0;

  if (totalHomeworkAssigned > 0) {
    homeworkTotal = totalHomeworkAssigned;
    homeworkCompleted = weeklyBookings.filter(b => b.report?.homeworkAssigned && b.report.homeworkAssigned.toLowerCase() !== 'no' && b.report.studentPerformance && b.report.studentPerformance >= 3).length;
  } else {
    homeworkTotal = weeklyBookings.length;
    homeworkCompleted = weeklyBookings.filter(b => b.report?.studentPerformance && b.report.studentPerformance >= 4).length;
  }

  const ratings = weeklyBookings.map(b => b.report?.studentPerformance).filter((r): r is number => typeof r === 'number');
  const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1) : '5.0';

  // --- صياغة نصيحة الحكيم المبنية على بيانات دقيقة (Hakeem's Data-Driven Advice) ---
  let hakeemMessage = '';
  const latestBooking = completedBookings[0];

  if (latestBooking && latestBooking.report) {
    const report = latestBooking.report;
    const studentName = latestBooking.student.name;
    const subjectName = latestBooking.teacherService.serviceType.name;
    
    if (report.teacherNotes && report.teacherNotes.trim() !== '') {
      hakeemMessage = `تشير التقارير إلى ملاحظة من معلم ${subjectName} بشأن ${studentName}: "${report.teacherNotes}". أنصحك بمتابعة هذه النقطة لضمان استمرار التحسن.`;
    } else if (report.homeworkAssigned && report.homeworkAssigned.trim() !== '' && report.homeworkAssigned.toLowerCase() !== 'no') {
      hakeemMessage = `أظهرت التقارير وجود واجب مدرسي في ${subjectName} مطلوب من ${studentName}: "${report.homeworkAssigned}". متابعة حله ستساهم في ترسيخ المعلومات بشكل كبير.`;
    } else if (report.studentPerformance && report.studentPerformance < 3) {
      hakeemMessage = `لاحظت تراجعاً طفيفاً في أداء ${studentName} في الجلسة الأخيرة لمادة ${subjectName}. قد يكون من المفيد حجز جلسة إضافية للتركيز على المفاهيم غير الواضحة.`;
    } else {
      hakeemMessage = `أداء ممتاز من ${studentName} في ${subjectName}! المراجعة المنتظمة هي مفتاح التفوق، استمروا على هذا النهج.`;
    }
  } else if (students.length > 0) {
    hakeemMessage = `أهلاً بك يا ${userName}. بناءً على البيانات، لم يتم تسجيل أي جلسات مكتملة بعد. البدء مبكراً خطوة حكيمة لتقييم المستوى الدراسي وتحديد الأهداف.`;
  } else {
    hakeemMessage = `يسعدنا انضمامك للمنصة. الخطوة الأولى والأساسية هي إضافة أبنائك وتحديث بياناتهم حتى أتمكن من تقديم تحليلات دقيقة لأدائهم لاحقاً.`;
  }

  // --- صياغة رسالة نجيب التشجيعية (Najeeb's Encouragement) ---
  let najeebMessage = '';
  let najeebMode: 'welcome' | 'study' | 'success' | 'help' = 'welcome';

  if (upcomingBookingsCount > 0) {
    najeebMessage = `يا سلام! لدينا ${upcomingBookingsCount} جلسة قادمة! 🚀 أنا متحمس جداً لبدء التعلم، تأكد من تجهيز الدفاتر والأقلام!`;
    najeebMode = 'study';
  } else if (homeworkCompleted > 0 && homeworkCompleted === homeworkTotal) {
    najeebMessage = `عمل رائع! لقد تم إنجاز جميع الواجبات المطلوبة بنجاح التام! 🌟 أبطالنا يستحقون مكافأة اليوم!`;
    najeebMode = 'success';
  } else if (students.length > 0 && upcomingBookingsCount === 0) {
    najeebMessage = `لا توجد جلسات مجدولة حالياً. ما رأيك أن نحجز جلسة جديدة لنستمر في رحلتنا التعليمية الممتعة؟ 💡`;
    najeebMode = 'help';
  } else {
    najeebMessage = `مرحباً بك! أنا نجيب، سأكون رفيقكم في هذه الرحلة الرائعة. هل أنت مستعد للبدء؟ ✨`;
    najeebMode = 'welcome';
  }

  return {
    hakeemMessage,
    najeebMessage,
    najeebMode,
    stats: {
      studentCount,
      upcomingBookingsCount,
      studyHours,
      homeworkCompleted,
      homeworkTotal,
      avgRating,
      isWeekly
    },
    nextSession,
    notifications
  };
}
