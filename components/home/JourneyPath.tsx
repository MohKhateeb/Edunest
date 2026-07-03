"use client";

import { motion } from "framer-motion";
import {
	BookOpen,
	CalendarCheck,
	GraduationCap,
	Rocket,
	Search,
	Star,
} from "lucide-react";
import React from "react";
import NajeebCharacter from "@/components/shared/NajeebCharacter";
import type { JourneyPathContent } from "@/types/homepage";

const ICONS = [Search, CalendarCheck, Rocket, Star, BookOpen, GraduationCap];
const GRADIENTS = [
	"from-blue-500 to-cyan-400",
	"from-purple-500 to-indigo-500",
	"from-amber-500 to-orange-400",
	"from-emerald-500 to-teal-400",
	"from-rose-500 to-pink-400",
];

export default function JourneyPath({
	content,
}: {
	content: JourneyPathContent;
}) {
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
						{content.title}
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.1 }}
						className="text-slate-500 dark:text-slate-400 font-medium"
					>
						{content.subtitle}
					</motion.p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12 md:gap-8 relative justify-center">
					{/* Najeeb guiding the way */}
					<div className="hidden md:block absolute -top-16 -right-16 z-20">
						<NajeebCharacter mode="success" size="md" animated={true} />
					</div>

					{content.steps.map((step, idx) => {
						const IconComponent = ICONS[idx % ICONS.length];
						const gradient = GRADIENTS[idx % GRADIENTS.length];

						return (
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
									className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl font-black text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
								>
									{idx + 1}
								</div>

								{/* Icon */}
								<div
									className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-inner mb-6 mt-4`}
								>
									<IconComponent className="w-6 h-6 text-white" />
								</div>

								<h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
									{step.title}
								</h3>
								<p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
									{step.description}
								</p>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
