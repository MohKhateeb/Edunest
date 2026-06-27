import { calculateEarnings } from "@/lib/utils/financial";

export type BookingAnalyticsData = {
	price: number | string | { toNumber: () => number };
	appliedCommissionRate: number | string | { toNumber: () => number };
	isTrial: boolean;
	trialCostToPlatform: number | string | { toNumber: () => number };
	status: string;
	completedAt?: Date | null;
	teacherService?: {
		teacher?: {
			subjects?: Array<{ subject: { name: string } }>;
		} | null;
		serviceType?: { name: string } | null;
	} | null;
};

export function computeFinancialKPIs(
	completedBookings: BookingAnalyticsData[],
	totalBookings: number,
) {
	let totalPlatformRevenue = 0;
	let totalBookingsValue = 0;

	for (const b of completedBookings) {
		const earnings = calculateEarnings(
			Number(b.price),
			Number(b.appliedCommissionRate),
			b.isTrial,
			Number(b.trialCostToPlatform),
		);
		totalBookingsValue += earnings.totalAmount;
		if (b.isTrial) {
			totalPlatformRevenue -= earnings.trialCompensation;
		} else {
			totalPlatformRevenue += earnings.commissionAmount;
		}
	}

	const averageOrderValue =
		completedBookings.length > 0
			? totalBookingsValue / completedBookings.length
			: 0;
	const completionRate =
		totalBookings > 0
			? ((completedBookings.length / totalBookings) * 100).toFixed(1)
			: "0.0";

	return { totalPlatformRevenue, averageOrderValue, completionRate };
}

export function computeBookingStatuses(allBookings: BookingAnalyticsData[]) {
	const statusCounts: Record<string, number> = {};
	for (const b of allBookings) {
		statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
	}
	const statusMap: Record<string, string> = {
		COMPLETED: "مكتمل",
		CONFIRMED: "مؤكد",
		PENDING: "معلق",
		CANCELLED: "ملغي",
		REJECTED: "مرفوض",
	};
	return Object.entries(statusCounts).map(([status, count]) => ({
		name: statusMap[status] || status,
		value: count,
	}));
}

export function computeRevenueTrends(
	completedBookings: BookingAnalyticsData[],
) {
	const revenueMap = new Map<string, number>();
	for (let i = 13; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const dateStr = d.toLocaleDateString("ar-PS", {
			month: "short",
			day: "numeric",
		});
		revenueMap.set(dateStr, 0);
	}
	for (const b of completedBookings) {
		if (!b.completedAt) continue;
		const dateStr = b.completedAt.toLocaleDateString("ar-PS", {
			month: "short",
			day: "numeric",
		});
		if (revenueMap.has(dateStr)) {
			let rev = 0;
			if (b.isTrial) rev -= Number(b.trialCostToPlatform);
			else rev = (Number(b.price) * Number(b.appliedCommissionRate)) / 100;
			revenueMap.set(dateStr, (revenueMap.get(dateStr) || 0) + rev);
		}
	}
	return Array.from(revenueMap.entries()).map(([date, revenue]) => ({
		date,
		revenue,
	}));
}

export function computeRequestedSpecializations(
	allBookings: BookingAnalyticsData[],
) {
	const specCounts: Record<string, number> = {};
	for (const b of allBookings) {
		const subjects = b.teacherService?.teacher?.subjects;
		if (subjects && subjects.length > 0) {
			for (const s of subjects) {
				const spec = s.subject.name;
				specCounts[spec] = (specCounts[spec] || 0) + 1;
			}
		} else {
			const spec = "غير محدد";
			specCounts[spec] = (specCounts[spec] || 0) + 1;
		}
	}
	return Object.entries(specCounts)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
}

export function computeSessionTypes(allBookings: BookingAnalyticsData[]) {
	const typeCounts: Record<string, number> = {};
	for (const b of allBookings) {
		const type = b.teacherService?.serviceType?.name || "غير محدد";
		typeCounts[type] = (typeCounts[type] || 0) + 1;
	}
	return Object.entries(typeCounts)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
}
