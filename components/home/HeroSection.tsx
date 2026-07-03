"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";
import HakeemCharacter from "@/components/shared/HakeemCharacter";
import NajeebCharacter from "@/components/shared/NajeebCharacter";
import type { HeroSectionContent } from "@/types/homepage";

export default function HeroSection({
	content,
}: {
	content: HeroSectionContent;
}) {
	return (
		<section className="relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-20 pb-32">
			<div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

			<div
				className="max-w-6xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
				dir="rtl"
			>
				{/* Texts & Call to action */}
				<div className="lg:col-span-6 flex flex-col space-y-8 text-center lg:text-right">
					{content.badge && (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="inline-flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-amber-200/50 dark:border-amber-900/50 rounded-full px-5 py-2 text-sm shadow-sm mx-auto lg:mx-0 w-fit"
						>
							<span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-bold px-3 py-1 rounded-full text-xs">
								{content.badge}
							</span>
							<span className="text-slate-700 dark:text-slate-300 font-semibold">
								{content.badgeMessage}
							</span>
						</motion.div>
					)}

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.1 }}
						className="space-y-4"
					>
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-slate-900 dark:text-white">
							{content.headline}{" "}
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
								{content.highlightedWord}
							</span>
						</h1>
						<p className="text-base md:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
							{content.subheadline}
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
					>
						<Link
							href={content.primaryBtnLink}
							className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl px-8 py-4 text-base transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-primary/30"
						>
							{content.primaryBtnText} <ArrowLeft className="w-5 h-5" />
						</Link>
						{content.secondaryBtnText && (
							<Link
								href={content.secondaryBtnLink}
								className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-bold rounded-2xl px-8 py-4 text-base transition-all duration-300 hover:-translate-y-1"
							>
								{content.secondaryBtnText}
							</Link>
						)}
					</motion.div>
				</div>

				{/* Characters illustration */}
				<div className="lg:col-span-6 relative h-[350px] md:h-[400px] flex items-end justify-center">
					<motion.div
						initial={{ opacity: 0, scale: 0.9, x: -30 }}
						animate={{ opacity: 1, scale: 1, x: 0 }}
						transition={{ duration: 0.8, delay: 0.3 }}
						className="absolute right-0 md:right-12 z-20"
					>
						<HakeemCharacter size="lg" className="drop-shadow-2xl" />
						<div className="absolute -top-12 -right-4 md:-right-8 bg-white dark:bg-slate-800 rounded-2xl rounded-br-none p-4 shadow-xl border border-slate-100 dark:border-slate-700 animate-[bounce_3s_ease-in-out_infinite]">
							<p className="text-xs font-bold text-slate-700 dark:text-slate-200">
								{content.character1Message}
							</p>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, scale: 0.9, x: 30 }}
						animate={{ opacity: 1, scale: 1, x: 0 }}
						transition={{ duration: 0.8, delay: 0.4 }}
						className="absolute left-0 md:left-12 z-10"
					>
						<NajeebCharacter
							mode="welcome"
							size="lg"
							animated={false}
							className="drop-shadow-2xl"
						/>
						<div className="absolute -top-16 -left-4 md:-left-8 bg-amber-50 dark:bg-slate-800 rounded-2xl rounded-bl-none p-4 shadow-xl border border-amber-100 dark:border-slate-700 animate-[bounce_3.5s_ease-in-out_infinite]">
							<p className="text-xs font-bold text-amber-700 dark:text-amber-400">
								{content.character2Message}
							</p>
						</div>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
