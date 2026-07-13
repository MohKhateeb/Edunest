import { describe, it, expect } from 'vitest';
import {
	formatCurrency,
	parseCurrencyInput,
	getCurrencySymbol,
	getCurrencyName,
	getAllCurrencies,
} from '@/lib/utils/currency';
import { Currency } from '@prisma/client';

describe('formatCurrency', () => {
	it('formats integer without decimals', () => {
		expect(formatCurrency(150, Currency.ILS)).toBe('150 ₪');
	});

	it('formats fractional amount with correct decimal places', () => {
		expect(formatCurrency(149.5, Currency.KWD)).toBe('149.500 د.ك');
		expect(formatCurrency(149.5, Currency.ILS)).toBe('149.50 ₪');
	});

	it('converts string input to number correctly', () => {
		expect(formatCurrency('200', Currency.USD)).toBe('200 $');
		expect(formatCurrency('150.75', Currency.ILS)).toBe('150.75 ₪');
	});

	it('handles objects with toNumber() (like Prisma Decimal)', () => {
		const decimalLike = { toNumber: () => 123.45 };
		expect(formatCurrency(decimalLike, Currency.EUR)).toBe('123.45 €');
	});

	it('handles null/undefined/NaN/non-numeric strings correctly', () => {
		expect(formatCurrency(null, Currency.ILS)).toBe('0 ₪');
		expect(formatCurrency(undefined, Currency.ILS)).toBe('0 ₪');
		expect(formatCurrency(NaN, Currency.ILS)).toBe('0 ₪');
		expect(formatCurrency('abc', Currency.USD)).toBe('0 $');
	});

	it('handles Infinity/-Infinity correctly', () => {
		expect(formatCurrency(Infinity, Currency.ILS)).toBe('0 ₪');
		expect(formatCurrency(-Infinity, Currency.ILS)).toBe('0 ₪');
	});

	it('uses default currency ILS if not provided', () => {
		expect(formatCurrency(150)).toBe('150 ₪');
	});
});

describe('parseCurrencyInput', () => {
	it('converts Arabic-Indic digits to Western digits', () => {
		expect(parseCurrencyInput('١٥٠')).toBe(150);
	});

	it('handles Arabic decimal comma correctly', () => {
		expect(parseCurrencyInput('١٢٫٥')).toBe(12.5);
	});

	it('handles Arabic thousands separator correctly', () => {
		expect(parseCurrencyInput('١٬٢٣٤٫٥٦')).toBe(1234.56);
	});

	it('handles English thousands separator correctly', () => {
		expect(parseCurrencyInput('1,500')).toBe(1500);
	});

	it('removes currency symbols correctly', () => {
		expect(parseCurrencyInput('₪150')).toBe(150);
		expect(parseCurrencyInput('د.ك 500')).toBe(500);
	});

	it('returns null for negative values', () => {
		expect(parseCurrencyInput('-150')).toBeNull();
		expect(parseCurrencyInput(-150)).toBeNull();
	});

	it('returns null for empty strings or spaces only', () => {
		expect(parseCurrencyInput('')).toBeNull();
		expect(parseCurrencyInput('   ')).toBeNull();
	});

	it('returns null for completely non-numeric strings', () => {
		expect(parseCurrencyInput('abc')).toBeNull();
	});

	it('returns null for NaN passed directly', () => {
		expect(parseCurrencyInput(NaN)).toBeNull();
	});
});

describe('getCurrencySymbol', () => {
	it('returns correct symbol for currency', () => {
		expect(getCurrencySymbol(Currency.ILS)).toBe('₪');
		expect(getCurrencySymbol(Currency.USD)).toBe('$');
	});
});

describe('getCurrencyName', () => {
	it('returns correct name for currency in specified locale', () => {
		expect(getCurrencyName(Currency.ILS, 'ar')).toBe('شيكل إسرائيلي');
		expect(getCurrencyName(Currency.USD, 'en')).toBe('US Dollar');
	});
});

describe('getAllCurrencies', () => {
	it('returns 9 elements matching the Currency enum', () => {
		const currencies = getAllCurrencies();
		expect(currencies).toHaveLength(9);
		expect(currencies.some((c) => c.code === Currency.ILS)).toBe(true);
		expect(currencies.some((c) => c.code === Currency.USD)).toBe(true);
	});
});
