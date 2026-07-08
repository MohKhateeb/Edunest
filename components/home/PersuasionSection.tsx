"use client";

import { motion } from "framer-motion";
import React from "react";
import HakeemCharacter from "@/components/shared/HakeemCharacter";
import NajeebCharacter from "@/components/shared/NajeebCharacter";
import SectionHeader from "@/components/shared/SectionHeader";
import type { PersuasionSectionContent } from "@/types/homepage";

import { useTranslations } from "next-intl";

export default function PersuasionSection({
	content,
}: {
	content: PersuasionSectionContent;
}) {
	const tAdvisors = useTranslations("advisors");
	
	// Helper to translate default strings or fallback to admin custom text
	const translateContent = (text: string, key: string) => {
		// If text matches the default Arabic, default English, or the translation key itself, translate it.
		// Otherwise, it means the admin has customized it, so return the custom text.
		const isDefault = [
			key,
			tAdvisors(key, { fallback: "" }),
			"دعنا نستمع لما يقوله حكيم ونجيب...",
			"Let's listen to what Hakeem and Najeeb have to say...",
			"نصيحة حكيم",
			"Hakeem's Advice",
			"\"يا بني، الوقت هو أثمن ما نملكه. والتعليم الفردي المخصص يختصر المسافات، يركز على نقاط الضعف، ويبني الثقة بالنفس بشكل أسرع بكثير من الطرق التقليدية.\"",
			"\"My son, time is our most precious asset. Personalized tutoring shortens distances, focuses on weaknesses, and builds self-confidence much faster than traditional methods.\"",
			"رأي نجيب",
			"Najeeb's Opinion",
			"\"صحيح جداً! وأفضل ما في الأمر أنني أستطيع اختيار المعلم الذي يفهمني، في الوقت الذي يناسبني تماماً دون أن أضطر لتغيير جدول يومي المليء بالأنشطة.\"",
			"\"Absolutely right! The best part is that I can choose the teacher who understands me, at a time that suits me perfectly without changing my busy daily schedule.\""
		].includes(text);
		
		return isDefault ? tAdvisors(key) : text;
	};
	return (
		<section className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
			<div className="max-w-5xl mx-auto px-6 relative">
				{/* Title */}
				<SectionHeader 
					title={content.title} 
					subtitle={translateContent(content.subtitle, "homepage_quotes_subtitle")} 
				/>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
					{/* Hakeem's Side */}
					<motion.div
						initial={{ opacity: 0, x: 50 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true }}
						className="relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-premium"
					>
						<div className="absolute -top-12 -start-6">
							<HakeemCharacter size="md" />
						</div>
						<div className="mt-16 space-y-4">
							<span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-full">
								{translateContent(content.hakeemTag, "hakeem_advice_tag")}
							</span>
							<p className="text-lg md:text-xl font-bold leading-relaxed text-slate-700 dark:text-slate-300">
								{translateContent(content.hakeemQuote, "hakeem_homepage_quote")}
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
						<div className="absolute -top-12 -end-6">
							<NajeebCharacter mode="success" size="md" animated={false} />
						</div>
						<div className="mt-16 space-y-4">
							<span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-full">
								{translateContent(content.najeebTag, "najeeb_opinion_tag")}
							</span>
							<p className="text-lg md:text-xl font-bold leading-relaxed text-slate-700 dark:text-slate-300">
								{translateContent(content.najeebQuote, "najeeb_homepage_quote")}
							</p>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
