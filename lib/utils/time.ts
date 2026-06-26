export const PALESTINE_TZ = "Asia/Hebron";

export function formatLocalTime(utcDate: Date | string): string {
	return new Intl.DateTimeFormat("ar-PS", {
		timeZone: PALESTINE_TZ,
		dateStyle: "full",
		timeStyle: "short",
	}).format(new Date(utcDate));
}

export function formatShortDate(utcDate: Date | string): string {
	return new Intl.DateTimeFormat("ar-PS", {
		timeZone: PALESTINE_TZ,
		day: "numeric",
		month: "long",
		year: "numeric",
	}).format(new Date(utcDate));
}

export function formatTimeOnly(utcDate: Date | string): string {
	return new Intl.DateTimeFormat("ar-PS", {
		timeZone: PALESTINE_TZ,
		timeStyle: "short",
	}).format(new Date(utcDate));
}

export function getDayOfWeekPalestine(utcDate: Date): number {
	const weekday = new Intl.DateTimeFormat("en-US", {
		timeZone: PALESTINE_TZ,
		weekday: "short",
	}).format(utcDate);
	const map: Record<string, number> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
	};
	return map[weekday] ?? 0;
}

export function getLocalTimeString(utcDate: Date): string {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: PALESTINE_TZ,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(utcDate);
}

export function getLocalDateString(utcDate: Date): string {
	return new Intl.DateTimeFormat("en-CA", { timeZone: PALESTINE_TZ }).format(
		utcDate,
	);
}

export function crossesMidnight(
	startUtc: Date,
	durationMinutes: number,
): boolean {
	const startDate = getLocalDateString(startUtc);
	const endUtc = new Date(startUtc.getTime() + durationMinutes * 60_000);
	const endDate = getLocalDateString(endUtc);
	return startDate !== endDate;
}

export function hoursUntil(utcDate: Date | string): number {
	return (new Date(utcDate).getTime() - Date.now()) / 3_600_000;
}
