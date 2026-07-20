"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { TimeRangeOption } from "@/lib/utils/date-range";

const TABS: { value: TimeRangeOption; key: string }[] = [
	{ value: "this_month", key: "time_range_this_month" },
	{ value: "last_month", key: "time_range_last_month" },
	{ value: "all", key: "time_range_all" },
];

export default function TimeRangeTabs() {
	const t = useTranslations("common");
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const current: TimeRangeOption =
		(searchParams.get("range") as TimeRangeOption) || "this_month";

	const buildUrl = (value: TimeRangeOption) => {
		const params = new URLSearchParams(searchParams.toString());
		if (value === "this_month") {
			params.delete("range");
		} else {
			params.set("range", value);
		}
		const qs = params.toString();
		return qs ? `${pathname}?${qs}` : pathname;
	};

	return (
		<div className="flex gap-1 p-1 bg-muted/60 rounded-xl w-fit">
			{TABS.map((tab) => (
				<Link
					key={tab.value}
					href={buildUrl(tab.value)}
					className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
						current === tab.value
							? "bg-white dark:bg-slate-800 text-primary shadow-sm"
							: "text-muted-foreground hover:text-foreground hover:bg-muted"
					}`}
				>
					{t(tab.key)}
				</Link>
			))}
		</div>
	);
}
