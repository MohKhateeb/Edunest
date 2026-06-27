"use client";

import { motion } from "framer-motion";
import React from "react";

interface SectionHeaderProps {
	title: string;
	subtitle?: string;
	className?: string;
}

export default function SectionHeader({
	title,
	subtitle,
	className = "text-center mb-16 space-y-4",
}: SectionHeaderProps) {
	return (
		<div className={className}>
			<motion.h2
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white"
			>
				{title}
			</motion.h2>
			{subtitle && (
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.1 }}
					className="text-slate-500 dark:text-slate-400 font-medium"
				>
					{subtitle}
				</motion.p>
			)}
		</div>
	);
}
