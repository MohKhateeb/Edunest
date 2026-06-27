import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string): string {
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	// إظهار الخانات العشرية فقط إذا كان الرقم يحتوي على كسور لتفادي لبس التقريب
	const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(2);
	return `${formatted} ₪`;
}

export function formatDuration(minutes: number): string {
	if (minutes < 60) return `${minutes} دقيقة`;
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (mins === 0) return `${hours} ساعة`;
	return `${hours} ساعة و${mins} دقيقة`;
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
