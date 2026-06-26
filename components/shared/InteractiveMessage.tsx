"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import HakeemCharacter from "./HakeemCharacter";
import NajeebCharacter from "./NajeebCharacter";

export type CharacterType = "najeeb" | "hakeem";
export type MessageMood =
	| "neutral"
	| "happy"
	| "encouraging"
	| "warning"
	| "advice";

interface InteractiveMessageProps {
	character: CharacterType;
	message: string | React.ReactNode;
	mood?: MessageMood;
	title?: string;
	className?: string;
	najeebMode?: "welcome" | "study" | "success" | "help";
}

export default function InteractiveMessage({
	character,
	message,
	mood = "neutral",
	title,
	className,
	najeebMode = "welcome",
}: InteractiveMessageProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isHakeem = character === "hakeem";

	if (!mounted) return null;

	// Define colors based on character and mood
	const bubbleStyles = isHakeem
		? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-200"
		: "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200";

	const titleStyles = isHakeem
		? "text-blue-700 dark:text-blue-400"
		: "text-emerald-700 dark:text-emerald-400";

	const pointerBg = isHakeem
		? "bg-blue-50 dark:bg-slate-900 border-blue-200 dark:border-blue-800"
		: "bg-emerald-50 dark:bg-slate-900 border-emerald-200 dark:border-emerald-800";

	return (
		<div className={cn("flex items-start gap-4 animate-fade-in-up", className)}>
			<div className="shrink-0 relative z-20">
				{isHakeem ? (
					<div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-3xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm flex items-center justify-center w-16 h-16">
						<HakeemCharacter size="sm" />
					</div>
				) : (
					<div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-3xl border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm flex items-center justify-center w-16 h-16">
						<NajeebCharacter size="xs" mode={najeebMode} animated={true} />
					</div>
				)}
			</div>

			<div
				className={cn(
					"relative flex-1 rounded-3xl p-5 border shadow-sm glass-card mt-2",
					bubbleStyles,
				)}
			>
				{/* Triangle pointer for the bubble */}
				<div
					className={cn(
						"absolute top-4 -right-2 w-4 h-4 rotate-45 border-t border-r z-10",
						pointerBg,
					)}
				></div>

				<div className="relative z-10 space-y-2">
					<h4
						className={cn(
							"text-sm font-black flex items-center gap-1.5",
							titleStyles,
						)}
						suppressHydrationWarning
					>
						{title || (isHakeem ? "الحكيم يقول:" : "نجيب يقول:")}
					</h4>
					<div
						className="text-sm leading-relaxed font-semibold text-slate-700 dark:text-slate-300"
						suppressHydrationWarning
					>
						{message}
					</div>
				</div>
			</div>
		</div>
	);
}
