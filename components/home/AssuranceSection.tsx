"use client";

import { motion } from "framer-motion";
import {
	CreditCard,
	Heart,
	type LucideIcon,
	MessageCircle,
	ShieldCheck,
	Star,
	Video,
} from "lucide-react";
import React from "react";
import HakeemCharacter from "@/components/shared/HakeemCharacter";
import SectionHeader from "@/components/shared/SectionHeader";
import type { AssuranceSectionContent } from "@/types/homepage";

const ICON_MAP: Record<string, LucideIcon> = {
	ShieldCheck,
	Video,
	CreditCard,
	MessageCircle,
	Star,
	Heart,
};

export default function AssuranceSection({
	content,
}: {
	content: AssuranceSectionContent;
}) {
	return (
		<section className="py-24 bg-white dark:bg-slate-950">
			<div className="max-w-6xl mx-auto px-6" dir="rtl">
				<SectionHeader title={content.title} subtitle={content.subtitle} />

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

						{/* Features Grid */}
						<div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
							{content.features.map((feature, idx) => {
								const IconCmp = ICON_MAP[feature.iconName] || ShieldCheck;
								return (
									<motion.div
										key={idx}
										initial={{ opacity: 0, y: 20 }}
										whileInView={{ opacity: 1, y: 0 }}
										viewport={{ once: true }}
										transition={{ delay: 0.1 + idx * 0.1 }}
										className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-shadow"
									>
										<div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
											<IconCmp className="w-6 h-6" />
										</div>
										<h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
											{feature.title}
										</h3>
										<p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
											{feature.description}
										</p>
									</motion.div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
