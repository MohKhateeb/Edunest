"use client";

import React from "react";
import { motion } from "framer-motion";
import HakeemCharacter from "@/components/shared/HakeemCharacter";
import NajeebCharacter from "@/components/shared/NajeebCharacter";

export default function PersuasionSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative" dir="rtl">
        {/* Title */}
        <div className="text-center mb-16 space-y-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white"
          >
            لماذا يثق بنا الآباء ويحبنا الطلاب؟
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400 font-medium"
          >
            دعنا نستمع لما يقوله حكيم ونجيب...
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Hakeem's Side */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-premium"
          >
            <div className="absolute -top-12 -right-6">
              <HakeemCharacter size="md" />
            </div>
            <div className="mt-16 space-y-4">
              <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-full">
                نصيحة حكيم
              </span>
              <p className="text-lg md:text-xl font-bold leading-relaxed text-slate-700 dark:text-slate-300">
                "يا بني، الوقت هو أثمن ما نملكه. والتعليم الفردي المخصص يختصر المسافات، يركز على نقاط الضعف، ويبني الثقة بالنفس بشكل أسرع بكثير من الطرق التقليدية."
              </p>
            </div>
          </motion.div>

          {/* Najeeb's Side */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-[2.5rem] p-8 md:p-10 shadow-premium mt-12 md:mt-0"
          >
            <div className="absolute -top-12 -left-6">
              <NajeebCharacter mode="success" size="md" animated={false} />
            </div>
            <div className="mt-16 space-y-4">
              <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-full">
                رأي نجيب
              </span>
              <p className="text-lg md:text-xl font-bold leading-relaxed text-slate-700 dark:text-slate-300">
                "صحيح جداً! وأفضل ما في الأمر أنني أستطيع اختيار المعلم الذي يفهمني، في الوقت الذي يناسبني تماماً دون أن أضطر لتغيير جدول يومي المليء بالأنشطة."
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
