import { getSettingBool, getSettingNumber } from "@/lib/settings";
import { SERVICES } from "@/lib/translations";
export async function calculateBookingFinancials(
	isTrial: boolean,
	serviceName: string,
	basePrice: number,
	baseDuration: number,
	parentHasUsedTrial: boolean,
) {
	let duration = baseDuration;
	let price = Number(basePrice);
	let appliedCommissionRate = 0;
	let trialCostToPlatform = 0;

	if (isTrial) {
		const trialEnabled = await getSettingBool("FreeTrialEnabled", true);
		if (!trialEnabled) {
			throw new Error("الجلسات التجريبية المجانية غير مفعلة حالياً");
		}
		if (parentHasUsedTrial) {
			throw new Error("لقد قمت باستخدام جلستك التجريبية المجانية مسبقاً");
		}

		duration = await getSettingNumber("FreeTrialDurationMinutes", 30);
		price = 0;
		appliedCommissionRate = 0;
		trialCostToPlatform = await getSettingNumber("FreeTrialCostToPlatform", 0);
	} else {
		const defaultComm = await getSettingNumber("DefaultCommissionRate", 15);
		const quickHelpComm = await getSettingNumber("QuickHelpCommissionRate", 20);
		const monthlyPackComm = await getSettingNumber(
			"MonthlyPackageCommissionRate",
			12,
		);

		if (serviceName === SERVICES.QUICK_HELP) {
			appliedCommissionRate = quickHelpComm;
		} else if (serviceName === SERVICES.MONTHLY_PACKAGE) {
			appliedCommissionRate = monthlyPackComm;
		} else {
			appliedCommissionRate = defaultComm;
		}

		const minPrice = await getSettingNumber("MinBookingPrice", 5);
		if (price < minPrice) {
			throw new Error(`الحد الأدنى لسعر الجلسة هو ${minPrice} شيكل`);
		}
	}

	return { duration, price, appliedCommissionRate, trialCostToPlatform };
}

export function hasTimeOverlap(
	start1: Date,
	durationMinutes1: number,
	start2: Date,
	durationMinutes2: number,
) {
	const startMs1 = start1.getTime();
	const endMs1 = startMs1 + durationMinutes1 * 60_000;

	const startMs2 = start2.getTime();
	const endMs2 = startMs2 + durationMinutes2 * 60_000;

	return Math.max(startMs1, startMs2) < Math.min(endMs1, endMs2);
}
