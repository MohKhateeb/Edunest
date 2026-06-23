import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import LiveRadar from '@/components/shared/LiveRadar';
import InteractiveMessage from '@/components/shared/InteractiveMessage';

export const dynamic = 'force-dynamic';

export default async function TeacherLiveRadarPage() {
  const session = await auth();
  if (!session || session.user.userType !== 'TEACHER') {
    redirect('/login');
  }

  // Fetch teacher details
  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true, specialization: true, gradeLevels: true, isAvailableNow: true }
  });

  if (!teacher) {
    redirect('/dashboard/profile');
  }

  // Fetch only PENDING requests that match the teacher's specialization and grades
  const rawRequests = await prisma.tutoringRequest.findMany({
    where: {
      status: 'PENDING',
      specialization: teacher.specialization,
      student: {
        grade: { in: teacher.gradeLevels }
      }
    },
    include: {
      student: { select: { name: true, grade: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Transform Decimals to numbers for the Client Component
  const liveRequests = rawRequests.map(req => ({
    id: req.id,
    title: req.title,
    specialization: req.specialization,
    price: Number(req.price || 50),
    duration: req.duration || 30,
    createdAt: req.createdAt,
    student: {
      name: req.student.name,
      grade: req.student.grade
    }
  }));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            الرادار الحي 📡
          </h1>
          <p className="text-slate-500 mt-2">
            التقط طلبات الفزعة الفورية للطلاب، وادخل الجلسة في ثوانٍ معدودة.
          </p>
        </div>
        
        <InteractiveMessage 
          character="hakeem"
          message={
            teacher.isAvailableNow 
              ? "الرادار يعمل! أي طالب يطلب فزعة في مادتك سيظهر هنا. كن أسرع من يلتقطه!"
              : "لتفعيل الرادار واستقبال الطلبات، يجب عليك تفعيل خيار 'متاح الآن' من ملفك."
          }
          className="max-w-md"
        />
      </div>

      <LiveRadar 
        teacherId={teacher.id} 
        initialRequests={liveRequests} 
        isAvailableNow={teacher.isAvailableNow} 
      />
    </div>
  );
}
