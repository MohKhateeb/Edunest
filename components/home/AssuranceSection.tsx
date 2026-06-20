"use client";

import React from "react";
import { motion } from "framer-motion";
import HakeemCharacter from "@/components/shared/HakeemCharacter";
import { ShieldCheck, Heart, Star } from "lucide-react";

export default function AssuranceSection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-6" dir="rtl">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-[3rem] p-8 md:p-12 shadow-premium relative overflow-hidden">
          
          {/* Background decorative elements */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-200/40 dark:bg-emerald-800/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-200/40 dark:bg-emerald-800/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Hakeem illustration */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800 rounded-full p-4 shadow-xl border border-emerald-100 dark:border-emerald-800"
              >
                <HakeemCharacter size="lg" />
              </motion.div>
            </div>

            {/* Message to parents */}
            <div className="lg:col-span-8 space-y-6 text-center lg:text-right">
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white"
              >
                رسالة من أب إلى كل أب وأم...
              </motion.h3>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg font-bold text-slate-600 dark:text-slate-300 leading-relaxed"
              >
                "بصفتي أباً قبل أن أكون معلماً، أعلم تماماً أنك تبحث عن الأمان، الجودة، والثقة لأبنائك. في إيدونِست، نحن لا نجمع المعلمين فحسب، بل نختار نخبة من المربين الموثوقين لنكون شركاءك الحقيقيين في نجاحهم."
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4"
              >
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">معلمون موثوقون</span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">جودة عالية</span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">اهتمام فردي</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
