import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

import { formatCurrency } from "./utils/currency";

export function formatPrice(amount: number | string): string {
	return formatCurrency(amount);
}

export { formatCurrency, getCurrencySymbol } from "./utils/currency";

export function formatDuration(minutes: number, locale: string): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;

	const hrFormat = new Intl.NumberFormat(locale, { style: "unit", unit: "hour" });
	const minFormat = new Intl.NumberFormat(locale, { style: "unit", unit: "minute" });
	const listFormat = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });

	if (hours === 0) return minFormat.format(minutes);
	if (mins === 0) return hrFormat.format(hours);

	return listFormat.format([hrFormat.format(hours), minFormat.format(mins)]);
}

export { formatLocalTime } from "./utils/time";

// Helper to sanitize Prisma Decimal and Date objects for safe Client Component transmission
export function sanitizePrismaData<T>(obj: T): T {
	if (obj === null || obj === undefined) return obj;

	if (obj instanceof Date) {
		return obj.toISOString() as unknown as T;
	}

	if (Array.isArray(obj)) {
		return obj.map(sanitizePrismaData) as unknown as T;
	}

	if (typeof obj === "object") {
		// Check if it is a Decimal (has .toNumber method)
		if (
			obj.constructor &&
			(obj.constructor.name === "Decimal" ||
				obj.constructor.name === "d" ||
				typeof (obj as { toNumber?: () => number }).toNumber === "function")
		) {
			return (
				obj as unknown as { toNumber: () => number }
			).toNumber() as unknown as T;
		}

		return Object.fromEntries(
			Object.entries(obj).map(([k, v]) => [k, sanitizePrismaData(v)]),
		) as unknown as T;
	}

	return obj;
}
