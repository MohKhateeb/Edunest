'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Clock, Briefcase, ArrowLeft, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import CharacterDialogue from './CharacterDialogue';
import { useRouter } from 'next/navigation';

export type BookingMode = 'teacher' | 'time' | 'general';

type BookingSelectionCardsProps = {
  onSelect: (mode: BookingMode) => void;
};

export default function BookingSelectionCards({ onSelect }: BookingSelectionCardsProps) {
  const router = useRouter();
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  };

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto py-8">
      {/* الترحيب من حكيم */}
      <CharacterDialogue
        character="hakeem"
        message="أهلاً بك يا صديقي! كيف تفضل أن نرتب جلسة اليوم لأبنائنا؟ الخيارات أمامك، اختر ما يريحك."
        align="right"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4"
      >
        {/* الخيار الأول: اختيار المعلم أولاً */}
        <motion.button
          variants={itemVariants}
          onClick={() => onSelect('teacher')}
          className="group relative flex flex-col text-right bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 overflow-hidden cursor-pointer h-full"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -z-0 transition-transform duration-500 group-hover:scale-110" />
          
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <User className="w-7 h-7" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
              أعرف من أبحث عنه! 🎯
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              اختر معلمك المفضل مباشرة واطلع على ملفه الشخصي ومواعيده المتاحة.
            </p>

            <div className="mt-auto flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm opacity-80 group-hover:opacity-100 transition-opacity">
              <span>اختر هذا المسار</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
          </div>
        </motion.button>

        {/* الخيار الثاني: البحث بالوقت */}
        <motion.button
          variants={itemVariants}
          onClick={() => onSelect('time')}
          className="group relative flex flex-col text-right bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-amber-200 dark:hover:border-amber-800 transition-all duration-300 overflow-hidden cursor-pointer h-full"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 dark:bg-amber-900/20 rounded-bl-full -z-0 transition-transform duration-500 group-hover:scale-110" />
          
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-7 h-7" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
              لدي وقت محدد ⏱️
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              الوقت من ذهب! حدد المادة والوقت الذي يناسبك، وسنظهر لك المعلمين المتاحين.
            </p>

            <div className="mt-auto flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm opacity-80 group-hover:opacity-100 transition-opacity">
              <span>اختر هذا المسار</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
          </div>
        </motion.button>

        {/* الخيار الثالث: فزعة سريعة (الرادار الحي) */}
        <motion.button
          variants={itemVariants}
          onClick={() => router.push('/dashboard/parent/live')}
          className="group relative flex flex-col text-right bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 overflow-hidden cursor-pointer h-full"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -z-0 transition-transform duration-500 group-hover:scale-110" />
          
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-7 h-7" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
              فزعة سريعة (الرادار الحي) ⚡
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              أرسل إشعاراً فورياً لجميع المعلمين المتاحين الآن للحصول على مساعدة عاجلة في أقل من دقيقة!
            </p>

            <div className="mt-auto flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm opacity-80 group-hover:opacity-100 transition-opacity">
              <span>اختر هذا المسار</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
          </div>
        </motion.button>

      </motion.div>
    </div>
  );
}
