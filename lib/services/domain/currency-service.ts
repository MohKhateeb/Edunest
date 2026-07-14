import { Currency } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CurrencyOption, getCurrencySymbol, getAllCurrencies } from "@/lib/utils/currency";

export async function getActiveCurrency(): Promise<CurrencyOption> {
	const config = await prisma.currencyConfig.findFirst({
		where: { isActiveForUser: true },
	});
	const code = config?.currency || Currency.ILS;
	
	const currencies = getAllCurrencies();
	const active = currencies.find(c => c.code === code);
	
	if (active) {
		return active;
	}

	return {
		code,
		symbol: getCurrencySymbol(code),
		nameAr: "",
		nameEn: "",
		decimalPlaces: 2,
	};
}
