import { prisma } from '@/lib/prisma';
import { getDayOfWeekPalestine, getLocalTimeString, crossesMidnight } from '@/lib/utils/time';

export async function checkTeacherAvailability(
  teacherId: string,
  startUtc: Date,
  durationMinutes: number
): Promise<{ available: boolean; reason?: string }> {
  if (crossesMidnight(startUtc, durationMinutes)) {
    return {
      available: false,
      reason: 'يجب أن تبدأ الجلسة وتنتهي في نفس اليوم بالتوقيت المحلي',
    };
  }

  const dayOfWeek = getDayOfWeekPalestine(startUtc);
  const localStart = getLocalTimeString(startUtc);
  const endUtc = new Date(startUtc.getTime() + durationMinutes * 60_000);
  const localEnd = getLocalTimeString(endUtc);

  // Fetch all active weekly recurring availabilities for this teacher on this day
  const windows = await prisma.teacherAvailability.findMany({
    where: {
      teacherId,
      dayOfWeek,
      isActive: true,
    },
  });

  // Find a window that completely covers the requested slot [localStart, localEnd]
  const isCovered = windows.some(
    (w) => w.startTime <= localStart && w.endTime >= localEnd
  );

  if (!isCovered) {
    return {
      available: false,
      reason: 'الوقت المطلوب ليس ضمن ساعات عمل المعلم المحددة لهذا اليوم',
    };
  }

  return { available: true };
}
