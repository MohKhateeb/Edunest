import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.systemSetting.findMany().then(s => console.log(s)).finally(() => prisma.$disconnect());
