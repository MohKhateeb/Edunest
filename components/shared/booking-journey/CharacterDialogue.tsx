"use client";

import { motion } from "framer-motion";
import type React from "react";
import HakeemCharacter from "@/components/shared/HakeemCharacter";
import NajeebCharacter from "@/components/shared/NajeebCharacter";
import { cn } from "@/lib/utils";

type CharacterDialogueProps = {
	character: "hakeem" | "najeeb";
	message: React.ReactNode;
	najeebMode?: "welcome" | "study" | "success" | "help";
	align?: "left" | "right";
	className?: string;
	delay?: number;
};

export default function CharacterDialogue({
	character,
	message,
	najeebMode = "success",
	align = "right",
	className,
	delay = 0,
}: CharacterDialogueProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
			className={cn(
				"flex items-end gap-4",
				align === "left" ? "flex-row-reverse" : "flex-row",
				className,
			)}
		>
			<div className="shrink-0 relative flex items-end drop-shadow-md z-10 w-20 h-20 md:w-24 md:h-24">
				{character === "hakeem" ? (
					<HakeemCharacter size="md" className="w-full h-full" />
				) : (
					<NajeebCharacter
						size="sm"
						mode={najeebMode}
						className="w-full h-full object-contain object-bottom"
					/>
				)}
			</div>

			<div
				className={cn(
					"relative bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 max-w-sm",
					align === "right" ? "rounded-br-none" : "rounded-bl-none",
					character === "hakeem"
						? "border-r-4 border-r-blue-400"
						: "border-l-4 border-l-amber-400",
				)}
			>
				<p className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
					{message}
				</p>
			</div>
		</motion.div>
	);
}
