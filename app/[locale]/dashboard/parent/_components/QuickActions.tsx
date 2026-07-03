"use client";

import Link from "next/link";
import { Zap, Wallet, CalendarPlus, HeadphonesIcon } from "lucide-react";

export default function QuickActions() {
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
			<Link 
				href="/dashboard/parent/bookings/new"
				className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-border/60 rounded-3xl shadow-sm hover:shadow-md transition-all group hover:border-primary/50"
			>
				<div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
					<CalendarPlus className="w-6 h-6" />
				</div>
				<span className="text-sm font-bold text-foreground">حجز جلسة</span>
			</Link>

			<Link 
				href="/dashboard/parent/live"
				className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-border/60 rounded-3xl shadow-sm hover:shadow-md transition-all group hover:border-purple-500/50 relative overflow-hidden"
			>
				<div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
				<div className="w-12 h-12 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform animate-pulse-soft">
					<Zap className="w-6 h-6" />
				</div>
				<span className="text-sm font-bold text-foreground relative z-10">فزعة سريعة</span>
			</Link>

			<Link 
				href="/dashboard/parent/financials"
				className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-border/60 rounded-3xl shadow-sm hover:shadow-md transition-all group hover:border-emerald-500/50"
			>
				<div className="w-12 h-12 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
					<Wallet className="w-6 h-6" />
				</div>
				<span className="text-sm font-bold text-foreground">المحفظة والدفع</span>
			</Link>

			<Link 
				href="/help"
				className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 border border-border/60 rounded-3xl shadow-sm hover:shadow-md transition-all group hover:border-blue-500/50"
			>
				<div className="w-12 h-12 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
					<HeadphonesIcon className="w-6 h-6" />
				</div>
				<span className="text-sm font-bold text-foreground">الدعم والمساعدة</span>
			</Link>
		</div>
	);
}
