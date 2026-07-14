import { Currency } from '@prisma/client';
import { prisma } from '../lib/prisma';

async function main() {
  const currencies = [
    { currency: Currency.ILS, isActiveForUser: true, displaySymbol: "₪", sortOrder: 0 },
    { currency: Currency.USD, isActiveForUser: false, displaySymbol: "$", sortOrder: 1 },
    { currency: Currency.EUR, isActiveForUser: false, displaySymbol: "€", sortOrder: 2 },
    { currency: Currency.JOD, isActiveForUser: false, displaySymbol: "د.أ", sortOrder: 3 },
    { currency: Currency.EGP, isActiveForUser: false, displaySymbol: "ج.م", sortOrder: 4 },
    { currency: Currency.SAR, isActiveForUser: false, displaySymbol: "ر.س", sortOrder: 5 },
    { currency: Currency.AED, isActiveForUser: false, displaySymbol: "د.إ", sortOrder: 6 },
    { currency: Currency.QAR, isActiveForUser: false, displaySymbol: "ر.ق", sortOrder: 7 },
    { currency: Currency.KWD, isActiveForUser: false, displaySymbol: "د.ك", sortOrder: 8 },
    { currency: Currency.TRY, isActiveForUser: false, displaySymbol: "₺", sortOrder: 9 },
  ];

  console.log('Seeding CurrencyConfig...');

  for (const c of currencies) {
    await prisma.currencyConfig.upsert({
      where: { currency: c.currency },
      update: c,
      create: c,
    });
  }

  console.log('CurrencyConfig seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
