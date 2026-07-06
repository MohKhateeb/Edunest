import { prisma } from "@/lib/prisma";

export const locationRepository = {
  async getActiveCitiesByCountry(countryCode: string = "PS") {
    return prisma.city.findMany({
      where: {
        isActive: true,
        country: { code: countryCode },
      },
      orderBy: { sortOrder: "asc" },
    });
  },
};
