"use client";

import { Calendar } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

export default function DateFilter() {
    const t = useTranslations('admin')
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [from, setFrom] = useState(searchParams.get("from") || "");
	const [to, setTo] = useState(searchParams.get("to") || "");

	const applyFilter = useCallback(() => {
		const params = new URLSearchParams(searchParams.toString());
		if (from) params.set("from", from);
		else params.delete("from");

		if (to) params.set("to", to);
		else params.delete("to");

		router.push(`${pathname}?${params.toString()}`);
	}, [from, to, searchParams, pathname, router]);

	const clearFilter = useCallback(() => {
		setFrom("");
		setTo("");
		const params = new URLSearchParams(searchParams.toString());
		params.delete("from");
		params.delete("to");
		router.push(`${pathname}?${params.toString()}`);
	}, [searchParams, pathname, router]);

	const hasFilters = searchParams.get("from") || searchParams.get("to");

	return (
		<div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-card p-3 rounded-2xl border border-border shadow-sm">
			<div className="flex items-center gap-2">
				<Calendar className="w-5 h-5 text-muted-foreground" />
				<span className="text-sm font-bold">{t('key_1783109439370_ac8c')}</span>
			</div>
			<div className="flex items-center gap-2">
				<input
					type="date"
					value={from}
					onChange={(e) => setFrom(e.target.value)}
					className="text-sm border border-input rounded-lg px-3 py-1.5 bg-background"
				/>
				<span className="text-muted-foreground">{t('key_1783109439374_3g5i')}</span>
				<input
					type="date"
					value={to}
					onChange={(e) => setTo(e.target.value)}
					className="text-sm border border-input rounded-lg px-3 py-1.5 bg-background"
				/>
				<button
					onClick={applyFilter}
					className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
				>
					{t('key_1783109439377_bola')}</button>
				{hasFilters && (
					<button
						onClick={clearFilter}
						className="text-muted-foreground hover:text-foreground text-sm px-2 transition-colors underline"
					>
						{t('key_1783109439380_z0ll')}</button>
				)}
			</div>
		</div>
	);
}
