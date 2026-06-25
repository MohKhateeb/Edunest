'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import NewBookingForm from './NewBookingForm';
import TimeFirstBookingForm from './TimeFirstBookingForm';
import BookingSelectionCards, { BookingMode } from './booking-journey/BookingSelectionCards';
import CharacterDialogue from './booking-journey/CharacterDialogue';

type Student = {
  id: string;
  name: string;
  grade: number;
};

type ServiceType = {
  id: string;
  name: string;
  nameEnglish: string | null;
  defaultDuration: number;
};

type TeacherService = {
  id: string;
  price: number;
  duration: number;
  serviceType: ServiceType;
};

type Teacher = {
  id: string;
  userId: string;
  slug: string;
  profileImageUrl: string | null;
  user: {
    name: string;
  };
  services: TeacherService[];
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  bookings: {
    startTime: Date;
    duration: number;
  }[];
};

type NewBookingPageProps = {
  students: Student[];
  teachers: Teacher[];
  hasUsedTrial: boolean;
  subjects: { id: string; name: string }[];
};

export default function NewBookingPage({
  students,
  teachers,
  hasUsedTrial,
  subjects,
}: NewBookingPageProps) {
  const [activeMode, setActiveMode] = useState<BookingMode | null>(null);

  const modeContent = activeMode ? {
    teacher: {
      form: <NewBookingForm students={students} teachers={teachers} hasUsedTrial={hasUsedTrial} />,
      dialogue: <CharacterDialogue character="najeeb" najeebMode="happy" message="اختيار ممتاز! تصفح قائمة المعلمين، واختر من يلبي طموحك، وأكمل تفاصيل الحجز وسنتولى نحن الباقي." align="right" />
    },
    time: {
      form: <TimeFirstBookingForm students={students} subjects={subjects} hasUsedTrial={hasUsedTrial} />,
      dialogue: <CharacterDialogue character="hakeem" message="خيار حكيم لحفظ وقتك. حدد موعدك ومادتك، وسأقوم بترشيح أفضل المعلمين المتاحين لك." align="right" />
    }
  }[activeMode] : null;

  return (
    <div className="space-y-4 relative min-h-[500px]" dir="rtl">
      {/* عنوان الصفحة (يظهر دائماً) */}
      <div className="text-center space-y-1 mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">حجز جلسة جديدة</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">ابدأ رحلة التعلم بخطوات بسيطة</p>
      </div>

      <AnimatePresence mode="wait">
        {!activeMode ? (
          <motion.div
            key="selection-cards"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <BookingSelectionCards onSelect={setActiveMode} />
          </motion.div>
        ) : (
          <motion.div
            key="booking-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto space-y-6 pb-20"
          >
            {/* رأس النموذج مع زر الرجوع وحوار الشخصية */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
              <button
                onClick={() => setActiveMode(null)}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md"
              >
                <ArrowRight className="w-4 h-4" />
                تغيير مسار الحجز
              </button>

              <div className="flex-1 max-w-lg">
                {modeContent?.dialogue}
              </div>
            </div>

            {/* عرض النموذج المختار */}
            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-1 rounded-3xl">
              {modeContent?.form}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
