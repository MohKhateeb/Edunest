"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Rocket, Search } from "lucide-react";
import React from "react";
import NajeebCharacter from "@/components/shared/NajeebCharacter";

export default function JourneyPath() {
	const steps = [
		{
			icon: <Search className="w-6 h-6 text-white" />,
			title: "ابحث عن المعلم الذي يلهمك",
			desc: "تصفح قائمة المعلمين الموثوقين واختر الأنسب لك.",
			gradient: "from-blue-500 to-cyan-400",
		},
		{
			icon: <CalendarCheck className="w-6 h-6 text-white" />,
			title: "اختر الوقت الذي يناسب جدولك",
			desc: "احجز جلستك بمرونة تامة وبضغطة زر.",
			gradient: "from-purple-500 to-indigo-500",
		},
		{
			icon: <Rocket className="w-6 h-6 text-white" />,
			title: "انطلق في رحلة التفوق!",
			desc: "ابدأ التعلم وحقق أهدافك بثقة.",
			gradient: "from-amber-500 to-orange-400",
		},
	];

	return (
		<section className="py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
			{/* Decorative path line in background */}
			<div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent hidden md:block z-0"></div>

			<div className="max-w-6xl mx-auto px-6 relative z-10" dir="rtl">
				<div className="text-center mb-20 space-y-4">
					<motion.h2
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white"
					>
						كيف تبدأ رحلتك؟
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.1 }}
						className="text-slate-500 dark:text-slate-400 font-medium"
					>
						خطوات بسيطة وسريعة لتبدأ التعلم فوراً
					</motion.p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
					{/* Najeeb guiding the way */}
					<div className="hidden md:block absolute -top-16 -right-16 z-20">
						<NajeebCharacter mode="success" size="md" animated={true} />
					</div>

					{steps.map((step, idx) => (
						<motion.div
							key={idx}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: idx * 0.2 }}
							className="relative bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-premium border border-slate-100 dark:border-slate-700 text-center hover:-translate-y-2 transition-transform duration-300 group"
						>
							{/* Step Number Bubble */}
							<div
								className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center text-xl font-black text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
							>
								{idx + 1}
							</div>

							{/* Icon */}
							<div
								className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-inner mb-6 mt-4`}
							>
								{step.icon}
							</div>

							<h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
								{step.title}
							</h3>
							<p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
								{step.desc}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
