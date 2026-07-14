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
	TRY: "₺",
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
	TRY: 2,
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
	
	if (typeof num !== "number" || !isFinite(num)) return `0 ${getCurrencySymbol(currency)}`;
	const decimalPlaces = CURRENCY_DECIMAL_PLACES[currency];
	const formatted = Number.isInteger(num)
		? num.toString()
		: num.toFixed(decimalPlaces);
	return `${formatted} ${getCurrencySymbol(currency)}`;
}

const CURRENCY_NAMES: Record<Currency, { ar: string; en: string }> = {
	ILS: { ar: "شيكل إسرائيلي", en: "Israeli Shekel" },
	USD: { ar: "دولار أمريكي", en: "US Dollar" },
	EUR: { ar: "يورو", en: "Euro" },
	JOD: { ar: "دينار أردني", en: "Jordanian Dinar" },
	EGP: { ar: "جنيه مصري", en: "Egyptian Pound" },
	SAR: { ar: "ريال سعودي", en: "Saudi Riyal" },
	AED: { ar: "درهم إماراتي", en: "UAE Dirham" },
	QAR: { ar: "ريال قطري", en: "Qatari Riyal" },
	KWD: { ar: "دينار كويتي", en: "Kuwaiti Dinar" },
	TRY: { ar: "ليرة تركية", en: "Turkish Lira" },
};

export function getCurrencyName(
	currency: Currency = Currency.ILS,
	locale: "ar" | "en" = "ar",
): string {
	return CURRENCY_NAMES[currency][locale];
}

export interface CurrencyOption {
	code: Currency;
	symbol: string;
	nameAr: string;
	nameEn: string;
	decimalPlaces: number;
}

export function getAllCurrencies(): CurrencyOption[] {
	return Object.values(Currency).map((code) => ({
		code,
		symbol: getCurrencySymbol(code),
		nameAr: CURRENCY_NAMES[code].ar,
		nameEn: CURRENCY_NAMES[code].en,
		decimalPlaces: CURRENCY_DECIMAL_PLACES[code],
	}));
}

export function parseCurrencyInput(value: string | number): number | null {
	if (typeof value === "number") {
		return isNaN(value) || value < 0 ? null : value;
	}
	
	let str = String(value).trim();
	if (!str) return null;

	// Convert Arabic-Indic digits to Western digits
	str = str.replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48));
	str = str.replace(/٫/g, ".");

	// Remove all known currency symbols
	const symbols = Object.values(CURRENCY_SYMBOLS);
	for (const sym of symbols) {
		str = str.replace(sym, "");
	}

	// Remove spaces, commas, and Arabic thousands separator (٬)
	str = str.replace(/[ ,٬]/g, "");

	const num = parseFloat(str);
	if (isNaN(num) || num < 0) return null;

	return num;
}
