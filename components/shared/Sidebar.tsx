"use client";

import {
	BadgeDollarSign,
	Briefcase,
	Calendar,
	CalendarPlus,
	ChevronLeft,
	ChevronRight,
	Clock,
	CreditCard,
	FileCheck,
	HelpCircle,
	LayoutDashboard,
	Settings,
	ShieldAlert,
	ShieldCheck,
	Sparkles,
	UserCheck,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import HakeemCharacter from "@/components/shared/HakeemCharacter";
import NajeebCharacter from "@/components/shared/NajeebCharacter";
import { adminLinks, parentLinks, teacherLinks } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const getADVISORTIPS = (t: any): Record<"PARENT" | "TEACHER" | "ADMIN", Array<{ advisor: "hakeem" | "najeeb"; text: string }>> => ({
	PARENT: [
		{ advisor: "hakeem", text: t('hakeem_sidebar_parent_1') },
		{ advisor: "najeeb", text: t('najeeb_sidebar_parent_1') },
		{ advisor: "hakeem", text: t('hakeem_sidebar_parent_2') },
		{ advisor: "najeeb", text: t('najeeb_sidebar_parent_2') },
	],
	TEACHER: [
		{ advisor: "hakeem", text: t('hakeem_sidebar_teacher_1') },
		{ advisor: "najeeb", text: t('najeeb_sidebar_teacher_1') },
		{ advisor: "hakeem", text: t('hakeem_sidebar_teacher_2') },
		{ advisor: "najeeb", text: t('najeeb_sidebar_teacher_2') },
	],
	ADMIN: [
		{ advisor: "hakeem", text: t('hakeem_sidebar_admin_1') },
		{ advisor: "najeeb", text: t('najeeb_sidebar_admin_1') },
	],
});

export default function Sidebar() {
    const t = useTranslations('common');
    const tNav = useTranslations('nav');
    const tAdvisors = useTranslations('advisors');
	const { data: session } = useSession();
	const pathname = usePathname();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [tipIndex, setTipIndex] = useState(0);

	useEffect(() => {
		const saved = localStorage.getItem("sidebar-collapsed");
		if (saved !== null) {
			setIsCollapsed(saved === "true");
		}
		setMounted(true);
		// Seed initial tip index based on date
		setTipIndex(new Date().getDate());
	}, []);

	if (!session?.user?.userType) return null;

	const role = session.user.userType;
	const links =
		role === "ADMIN"
			? adminLinks
			: role === "TEACHER"
				? teacherLinks
				: parentLinks;

	const toggleCollapse = () => {
		const nextValue = !isCollapsed;
		setIsCollapsed(nextValue);
		localStorage.setItem("sidebar-collapsed", String(nextValue));
	};

	// Advisor tips selection
	const tips =
		getADVISORTIPS(tAdvisors)[role as keyof ReturnType<typeof getADVISORTIPS>] || getADVISORTIPS(tAdvisors).PARENT;
	const activeTip = tips[tipIndex % tips.length];

	const cycleTip = () => {
		setTipIndex((prev) => prev + 1);
	};

	return (
		<aside
			className={cn(
				"bg-white dark:bg-slate-950 border-e border-slate-100 dark:border-slate-900/60 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col p-4 text-start transition-all duration-300 ease-in-out select-none shadow-sm",
				isCollapsed ? "w-20" : "w-64",
			)}
		>
			{/* Header and Collapse Trigger */}
			<div className="flex items-center justify-between mb-5 border-b border-border/50 pb-3.5 gap-1">
				{!isCollapsed && (
					<span
						className={cn(
							"px-3 py-1 text-[10px] font-extrabold rounded-full tracking-widest truncate animate-in fade-in duration-300",
							role === "ADMIN" &&
								"bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400",
							role === "TEACHER" &&
								"bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
							role === "PARENT" &&
								"bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground",
						)}
					>
						{role === "ADMIN"
							? t('lwhh_almshrf')
							: role === "TEACHER"
								? t('lwhh_almalm')
								: t('lwhh_wly_alamr')}
					</span>
				)}
				<button
					onClick={toggleCollapse}
					className={cn(
						"p-1.5 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer",
						isCollapsed && "mx-auto",
					)}
					title={isCollapsed ? t('twsya_alqaemh') : t('tsghyr_alqaemh')}
				>
					{isCollapsed ? (
						<ChevronLeft className="h-4.5 w-4.5" />
					) : (
						<ChevronRight className="h-4.5 w-4.5" />
					)}
				</button>
			</div>

			{/* Nav Links */}
			<nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden min-h-0 ps-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{links.map((link) => {
					const Icon = link.icon;
					const isActive = pathname === link.href;

					return (
						<Link
							key={link.href}
							href={link.href}
							className={cn(
								"group flex items-center rounded-xl text-xs font-bold transition-all duration-200",
								isCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5",
								isActive
									? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-md shadow-primary/20 scale-[1.02] transform"
									: "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:text-primary dark:hover:text-white",
							)}
							title={isCollapsed ? tNav(link.label) : undefined}
						>
							<Icon
								className={cn(
									"h-4.5 w-4.5 shrink-0 transition-colors duration-200",
									isActive
										? "text-white"
										: "text-slate-400 dark:text-slate-500 group-hover:text-primary",
								)}
							/>
							{!isCollapsed && (
								<span className="truncate animate-in fade-in duration-300">
									{tNav(link.label)}
								</span>
							)}
						</Link>
					);
				})}
			</nav>

			{/* Advisor Interactive Block (Hakeem & Najeeb) */}
			<div className="border-t border-border/50 pt-4 mt-auto">
				{!isCollapsed ? (
					<div className="bg-gradient-to-br from-indigo-50/50 to-primary/5 dark:from-slate-900/60 dark:to-primary/10 border border-primary/15 rounded-2xl p-3 shadow-sm text-start animate-in fade-in duration-500">
						<div className="flex justify-between items-center mb-2">
							<span className="text-[10px] font-black text-primary flex items-center gap-1">
								<Sparkles className="h-3 w-3" />
								{activeTip.advisor === "hakeem"
									? t('mstsharna_alhkym')
									: t('almlhm_njyb')}
							</span>
							<button
								onClick={cycleTip}
								className="text-[9px] font-black text-muted-foreground hover:text-primary cursor-pointer transition-colors"
							>
								{t('nsyhh_akhra')}</button>
						</div>
						<div className="flex gap-2.5 items-center">
							<div className="flex-shrink-0 bg-white/40 dark:bg-slate-800/40 rounded-xl p-1 border border-primary/10">
								{activeTip.advisor === "hakeem" ? (
									<HakeemCharacter size="sm" className="w-10 h-10" />
								) : (
									<NajeebCharacter
										mode="study"
										size="xs"
										className="w-10 h-10"
									/>
								)}
							</div>
							<p className="text-[10px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium flex-1">
								"{activeTip.text}"
							</p>
						</div>
					</div>
				) : (
					<div className="group relative flex justify-center py-2">
						<button
							onClick={cycleTip}
							className="cursor-pointer hover:scale-110 transition-transform duration-200 focus:outline-none w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-50/50 to-primary/5 dark:from-slate-900/60 dark:to-primary/10 border border-primary/15 rounded-xl p-1"
							title={t('nsyhh_alywm')}
						>
							{activeTip.advisor === "hakeem" ? (
								<HakeemCharacter size="sm" className="w-8 h-8" />
							) : (
								<NajeebCharacter mode="study" size="xs" className="w-8 h-8" />
							)}
						</button>

						{/* Rich Tooltip popup on hover */}
						<div className="absolute start-full ms-3 top-1/2 -translate-y-1/2 hidden group-hover:block w-52 bg-white dark:bg-slate-900 border border-border/80 text-foreground text-[10px] p-3 rounded-2xl shadow-premium z-50 pointer-events-none text-start animate-in fade-in zoom-in-95 duration-200">
							<div className="font-black text-primary mb-2 border-b border-border/50 pb-1 flex items-center gap-1">
								<Sparkles className="h-3 w-3" />
								{activeTip.advisor === "hakeem"
									? t('mstsharna_alhkym')
									: t('almlhm_njyb')}
							</div>
							<div className="flex gap-2 items-center">
								<div className="flex-shrink-0 bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5 border border-primary/10">
									{activeTip.advisor === "hakeem" ? (
										<HakeemCharacter size="sm" className="w-7 h-7" />
									) : (
										<NajeebCharacter
											mode="study"
											size="xs"
											className="w-7 h-7"
										/>
									)}
								</div>
								<p className="leading-relaxed font-semibold text-slate-700 dark:text-slate-300 flex-1">
									{activeTip.text}
								</p>
							</div>
						</div>
					</div>
				)}
			</div>
		</aside>
	);
}
