import { prisma } from './lib/prisma';

async function debugQuickHelp() {
  try {
    const recentRequests = await prisma.tutoringRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        student: true,
        parent: true,
        serviceType: true,
      }
    });

    console.log(`Found ${recentRequests.length} recent requests.`);
    recentRequests.forEach((req, idx) => {
      console.log(`\n[${idx + 1}] Request ID: ${req.id}`);
      console.log(`Title: ${req.title}`);
      console.log(`Status: ${req.status}`);
      console.log(`Price: ${req.price}`);
      console.log(`Subject ID: ${req.subjectId}`);
      console.log(`Service Type: ${req.serviceType?.name}`);
      console.log(`Student Grade: ${req.student?.grade}`);
    });

    // Also check teacher availability
    const activeTeachers = await prisma.teacher.findMany({
      where: { isAvailableNow: true },
      include: { user: true }
    });
    
    console.log(`\nFound ${activeTeachers.length} teachers currently 'Available Now':`);
    activeTeachers.forEach(t => {
      console.log(`- ${t.user.name} (Grades: ${t.gradeLevels.join(',')})`);
    });

  } catch (err) {
    console.error('Error debugging:', err);
  } finally {
    await prisma.$disconnect();
  }
}

debugQuickHelp();
