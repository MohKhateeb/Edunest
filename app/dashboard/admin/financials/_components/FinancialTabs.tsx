"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { 
	Activity, 
	BadgeDollarSign, 
	CreditCard, 
	ShieldAlert, 
	TrendingUp 
} from "lucide-react";

const tabs = [
	{ id: "overview", label: "النظرة العامة والإيرادات", icon: Activity },
	{ id: "revenue", label: "تفاصيل أرباح المنصة", icon: TrendingUp },
	{ id: "payouts", label: "تسويات المعلمين", icon: BadgeDollarSign },
	{ id: "escrow", label: "الأموال المجمدة", icon: ShieldAlert },
];

export default function FinancialTabs() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const currentTab = searchParams.get("tab") || "overview";

	const setTab = useCallback(
		(tabId: string) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set("tab", tabId);
			router.push(`${pathname}?${params.toString()}`);
		},
		[searchParams, pathname, router],
	);

	return (
		<div className="flex overflow-x-auto bg-white/50 dark:bg-card/50 p-1.5 rounded-2xl border border-border backdrop-blur-md mb-8">
			{tabs.map((tab) => {
				const Icon = tab.icon;
				const isActive = currentTab === tab.id;
				return (
					<button
						key={tab.id}
						onClick={() => setTab(tab.id)}
						className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
							isActive
								? "bg-primary text-primary-foreground shadow-md"
								: "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
						}`}
					>
						<Icon className="w-5 h-5" />
						{tab.label}
					</button>
				);
			})}
		</div>
	);
}
