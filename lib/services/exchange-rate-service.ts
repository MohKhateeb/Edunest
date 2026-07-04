import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const EXCHANGE_API_URL = "https://open.er-api.com/v6/latest/USD";

/**
 * Fetches the latest exchange rates from a public API and updates CurrencyConfig.
 * Uses USD as the base currency.
 */
export async function syncExchangeRates() {
	try {
		console.log("🔄 Fetching latest exchange rates...");
		const response = await fetch(EXCHANGE_API_URL, {
			next: { revalidate: 3600 }, // Cache for 1 hour
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
		}

		const data = await response.json();
		if (data.result !== "success" || !data.rates) {
			throw new Error("Invalid response from exchange rate API");
		}

		const rates = data.rates as Record<string, number>;
		
		// Get all currently supported currencies in our DB
		const configs = await prisma.currencyConfig.findMany();

		const updatePromises = configs.map((config) => {
			const newRate = rates[config.currency];
			if (newRate !== undefined) {
				return prisma.currencyConfig.update({
					where: { currency: config.currency },
					data: { exchangeRate: newRate },
				});
			}
			return Promise.resolve(config);
		});

		await Promise.all(updatePromises);
		console.log("✅ Exchange rates synchronized successfully.");
		
		return { success: true };
	} catch (error: any) {
		console.error("❌ Error syncing exchange rates:", error);
		return { success: false, error: error.message };
	}
}
