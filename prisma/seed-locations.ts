import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const { prisma } = await import('../lib/prisma');
  const CITIES = [
    { nameAr: "رام الله", nameEn: "Ramallah", slug: "ramallah", sortOrder: 0 },
    { nameAr: "البيرة", nameEn: "Al-Bireh", slug: "al-bireh", sortOrder: 1 },
    { nameAr: "نابلس", nameEn: "Nablus", slug: "nablus", sortOrder: 2 },
    { nameAr: "الخليل", nameEn: "Hebron", slug: "hebron", sortOrder: 3 },
    { nameAr: "بيت لحم", nameEn: "Bethlehem", slug: "bethlehem", sortOrder: 4 },
    { nameAr: "جنين", nameEn: "Jenin", slug: "jenin", sortOrder: 5 },
    { nameAr: "طولكرم", nameEn: "Tulkarm", slug: "tulkarm", sortOrder: 6 },
    { nameAr: "قلقيلية", nameEn: "Qalqilya", slug: "qalqilya", sortOrder: 7 },
    { nameAr: "سلفيت", nameEn: "Salfit", slug: "salfit", sortOrder: 8 },
    { nameAr: "أريحا", nameEn: "Jericho", slug: "jericho", sortOrder: 9 },
    { nameAr: "طوباس", nameEn: "Tubas", slug: "tubas", sortOrder: 10 },
    { nameAr: "القدس", nameEn: "Jerusalem", slug: "jerusalem", sortOrder: 11 },
  ];

  console.log("Seeding Palestine and 12 cities...");

  const country = await prisma.country.upsert({
    where: { code: "PS" },
    update: {},
    create: {
      code: "PS",
      nameAr: "فلسطين",
      nameEn: "Palestine",
    },
  });

  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: {
        nameAr: city.nameAr,
        nameEn: city.nameEn,
        sortOrder: city.sortOrder,
        countryId: country.id
      },
      create: {
        countryId: country.id,
        nameAr: city.nameAr,
        nameEn: city.nameEn,
        slug: city.slug,
        sortOrder: city.sortOrder,
      },
    });
  }

  console.log("Locations seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
