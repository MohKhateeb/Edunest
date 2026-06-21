"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import NajeebCharacter from "@/components/shared/NajeebCharacter";
import HakeemCharacter from "@/components/shared/HakeemCharacter";

export default function FooterCTA() {
  return (
    <section className="py-32 relative overflow-hidden bg-gradient-to-br from-primary to-blue-700">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50"></div>
      
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center space-y-10" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center items-end gap-4 mb-8"
        >
          <HakeemCharacter size="md" className="translate-y-4" />
          <NajeebCharacter mode="success" size="md" animated={false} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            نحن بانتظارك لنحتفل بنجاحاتك القادمة!
          </h2>
          <p className="text-lg text-blue-100 font-medium">
            انضم لعائلة إديونست اليوم، وابدأ رحلة تعليمية لا تُنسى.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/register"
            className="inline-block bg-white text-primary hover:bg-slate-50 font-black rounded-2xl px-12 py-5 text-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 shadow-xl"
          >
            سجل حسابك الآن وانضم إلينا 🚀
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
