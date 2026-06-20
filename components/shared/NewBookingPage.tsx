'use client';

import { useState } from 'react';
import NewBookingForm from './NewBookingForm';
import TimeFirstBookingForm from './TimeFirstBookingForm';
import NewGeneralRequestForm from './NewGeneralRequestForm';
import { User, Clock, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  specializations: string[];
  serviceTypes: ServiceType[];
};

export default function NewBookingPage({
  students,
  teachers,
  hasUsedTrial,
  specializations,
  serviceTypes,
}: NewBookingPageProps) {
  const [activeTab, setActiveTab] = useState<'teacher' | 'time' | 'general'>('teacher');

  return (
    <div className="space-y-4">
      {/* عنوان الصفحة */}
      <div className="text-center space-y-1 mb-2">
        <h1 className="text-2xl font-extrabold">حجز جلسة جديدة</h1>
        <p className="text-xs text-muted-foreground">اختر طريقة الحجز المناسبة لك</p>
      </div>

      {/* التبويبات */}
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'teacher'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            )}
          >
            <User className="h-4 w-4" />
            اختيار المعلم أولاً
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('time')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'time'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            )}
          >
            <Clock className="h-4 w-4" />
            البحث بالوقت والمادة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'general'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            )}
          >
            <Briefcase className="h-4 w-4" />
            طلب معلم عام (أوبر)
          </button>
        </div>
      </div>

      {/* محتوى التبويب */}
      <div className="animate-fadeIn">
        {activeTab === 'teacher' ? (
          <NewBookingForm
            students={students}
            teachers={teachers}
            hasUsedTrial={hasUsedTrial}
          />
        ) : activeTab === 'time' ? (
          <TimeFirstBookingForm
            students={students}
            specializations={specializations}
            hasUsedTrial={hasUsedTrial}
          />
        ) : (
          <NewGeneralRequestForm
            students={students}
            specializations={specializations}
            serviceTypes={serviceTypes}
          />
        )}
      </div>
    </div>
  );
}
