/**
 * Utility functions for financial calculations across the platform.
 */

/**
 * Calculates the platform's commission amount and the teacher's net earnings for a booking.
 *
 * @param price - The total price of the booking.
 * @param appliedCommissionRate - The commission rate applied to the booking (in percentage).
 * @param isTrial - Whether the booking is a trial session.
 * @param trialCostToPlatform - The cost the platform bears for a trial session.
 * @returns An object containing the commissionAmount, netAmount, etc.
 */
export function calculateEarnings(
	price: number | string,
	appliedCommissionRate: number | string,
	isTrial: boolean,
	trialCostToPlatform: number | string,
) {
	const numericPrice = Number(price);
	const numericCommRate = Number(appliedCommissionRate);
	const numericTrialCost = Number(trialCostToPlatform);

	let commissionAmount = 0;
	let trialCompensation = 0;
	let totalAmount = 0;

	if (isTrial) {
		trialCompensation = numericTrialCost;
	} else {
		totalAmount = numericPrice;
		commissionAmount = (numericPrice * numericCommRate) / 100;
	}

	// Use precision rounding to avoid floating-point math issues
	totalAmount = Math.round(totalAmount * 100) / 100;
	commissionAmount = Math.round(commissionAmount * 100) / 100;
	trialCompensation = Math.round(trialCompensation * 100) / 100;

	const netAmount = Math.round((totalAmount - commissionAmount) * 100) / 100;

	// The actual payout adds trial compensation to the teacher's wallet
	const teacherTotalEarnings = netAmount + trialCompensation;

	return {
		totalAmount,
		commissionAmount,
		trialCompensation,
		netAmount,
		teacherTotalEarnings,
	};
}
