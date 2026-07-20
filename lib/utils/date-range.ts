export type TimeRangeOption = "this_month" | "last_month" | "all";

export function getTimeRangeDates(
	range: TimeRangeOption,
): { gte: Date; lte: Date } | undefined {
	if (range === "all") return undefined;
	const now = new Date();
	const monthOffset = range === "last_month" ? -1 : 0;
	const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1, 0, 0, 0, 0);
	const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59, 999);
	return { gte: start, lte: end };
}
