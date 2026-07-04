import { Currency } from "@prisma/client";

// ════════════════════════════════════════════════════
// Static currency metadata — mirrors CurrencyConfig seed data.
// Used client-side where DB access is unavailable.
// ════════════════════════════════════════════════════

const CURRENCY_SYMBOLS: Record<Currency, string> = {
	ILS: "₪",
	USD: "$",
	EUR: "€",
	JOD: "د.أ",
	EGP: "ج.م",
	SAR: "ر.س",
	AED: "د.إ",
	QAR: "ر.ق",
	KWD: "د.ك",
};

const CURRENCY_DECIMAL_PLACES: Record<Currency, number> = {
	ILS: 2,
	USD: 2,
	EUR: 2,
	JOD: 3,
	EGP: 2,
	SAR: 2,
	AED: 2,
	QAR: 2,
	KWD: 3,
};

/**
 * Returns the display symbol for a given currency.
 * Useful for chart axes, input prefixes, and other contexts
 * where only the symbol is needed without an amount.
 */
export function getCurrencySymbol(currency: Currency = Currency.ILS): string {
	return CURRENCY_SYMBOLS[currency];
}

/**
 * Formats a monetary amount with the correct currency symbol and decimal places.
 *
 * - Integers are shown without decimals (e.g. "150 ₪")
 * - Fractional amounts use the currency's standard decimal places (e.g. "149.50 ₪")
 * - Accepts number or string (Prisma Decimal serialized values)
 *
 * @example
 * formatCurrency(150)          // "150 ₪"
 * formatCurrency(149.5)        // "149.50 ₪"
 * formatCurrency("200", "USD") // "200 $"
 * formatCurrency(3.141, "KWD") // "3.141 د.ك"
 */
export function formatCurrency(
	amount: number | string | any,
	currency: Currency = Currency.ILS,
): string {
	let num = amount;
	if (typeof amount === "string") {
		num = parseFloat(amount);
	} else if (amount && typeof amount.toNumber === "function") {
		num = amount.toNumber();
	} else if (typeof amount === "object") {
		num = Number(amount);
	}
	
	if (isNaN(num)) return `0 ${getCurrencySymbol(currency)}`;
	const decimalPlaces = CURRENCY_DECIMAL_PLACES[currency];
	const formatted = Number.isInteger(num)
		? num.toString()
		: num.toFixed(decimalPlaces);
	return `${formatted} ${getCurrencySymbol(currency)}`;
}
