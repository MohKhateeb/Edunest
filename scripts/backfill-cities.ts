import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const { prisma } = await import('../lib/prisma');
  console.log("Starting backfill for Teacher.cityId...");
  
  const teachers = await prisma.teacher.findMany({
    where: {
      city: { not: null },
      cityId: null
    }
  });

  const psCountry = await prisma.country.findUnique({
    where: { code: 'PS' },
    include: { cities: true }
  });

  if (!psCountry) {
    console.error("PS country not found. Did you run the seed script?");
    return;
  }

  const cities = psCountry.cities;
  
  let successCount = 0;
  const failedTeachers = [];

  for (const teacher of teachers) {
    if (!teacher.city) continue;
    
    const cityStr = teacher.city.trim().toLowerCase();
    
    // Find exact match in nameAr
    const match = cities.find(c => c.nameAr.trim() === cityStr);
    
    if (match) {
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { cityId: match.id }
      });
      successCount++;
    } else {
      failedTeachers.push({
        id: teacher.id,
        name: teacher.slug, // Can use slug or user.name (but we didn't include user)
        rawCity: teacher.city
      });
    }
  }

  console.log("Backfill Report:");
  console.log(`Successfully mapped: ${successCount}`);
  console.log(`Failed to map: ${failedTeachers.length}`);
  
  if (failedTeachers.length > 0) {
    console.log("--- Failed Teachers List ---");
    failedTeachers.forEach(t => {
      console.log(`Teacher ID: ${t.id} | Slug: ${t.name} | Raw City: '${t.rawCity}'`);
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
