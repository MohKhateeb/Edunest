"use client";
import { useTranslations } from "next-intl";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { 
	Activity, 
	BadgeDollarSign, 
	CreditCard, 
	ShieldAlert, 
	TrendingUp 
} from "lucide-react";

const getTabs = (t: ReturnType<typeof useTranslations>) => [
	{ id: "overview", label: t('key_1783109439387_fkhc'), icon: Activity },
	{ id: "revenue", label: t('key_1783109434023_f2go'), icon: TrendingUp },
	{ id: "payouts", label: t('key_1783109439390_h1o3'), icon: BadgeDollarSign },
	{ id: "escrow", label: t('key_1783109439390_4o2q'), icon: ShieldAlert },
];

import { useMemo } from 'react';

export default function FinancialTabs() {
    const t = useTranslations('admin');
	const tabs = useMemo(() => getTabs(t), [t]);
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
