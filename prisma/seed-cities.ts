import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We must import dynamically so dotenv gets a chance to populate process.env first!
async function main() {
  const { prisma } = await import("../lib/prisma");

  const CITIES = [
    { nameAr: "رام الله", nameEn: "Ramallah", slug: "ramallah", sortOrder: 1 },
    { nameAr: "الخليل", nameEn: "Hebron", slug: "hebron", sortOrder: 2 },
    { nameAr: "نابلس", nameEn: "Nablus", slug: "nablus", sortOrder: 3 },
    { nameAr: "القدس", nameEn: "Jerusalem", slug: "jerusalem", sortOrder: 4 },
    { nameAr: "بيت لحم", nameEn: "Bethlehem", slug: "bethlehem", sortOrder: 5 },
    { nameAr: "طولكرم", nameEn: "Tulkarm", slug: "tulkarm", sortOrder: 6 },
    { nameAr: "قلقيلية", nameEn: "Qalqilya", slug: "qalqilya", sortOrder: 7 },
    { nameAr: "جنين", nameEn: "Jenin", slug: "jenin", sortOrder: 8 },
    { nameAr: "أريحا", nameEn: "Jericho", slug: "jericho", sortOrder: 9 },
  ];

  console.log("Seeding Palestine and cities...");
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
  console.log("Cities seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
