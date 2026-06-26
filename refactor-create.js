const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'lib/actions/bookings/create.ts');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('booking-logic')) {
  content = content.replace(
    "import { z } from 'zod';",
    "import { z } from 'zod';\nimport { calculateBookingFinancials, hasTimeOverlap } from '@/lib/utils/booking-logic';"
  );
}

// Replace the financial block
const oldFinancialBlockRegex = /\/\/ 4\. Fetch dynamic settings and calculate price\/duration\/commission[\s\S]*?(?=\/\/ 5\. Check Weekly Recurring Availability)/m;
const newFinancialBlock = `// 4. Calculate Financials using unified logic
    const parentUser = await prisma.user.findUnique({
      where: { id: parentUserId },
    });
    if (!parentUser) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    let financials;
    try {
      financials = await calculateBookingFinancials(
        isTrial,
        teacherService.serviceType.name,
        Number(teacherService.price),
        teacherService.duration,
        parentUser.hasUsedFreeTrial
      );
    } catch (err: any) {
      return { success: false, error: err.message };
    }

    const { duration, price, appliedCommissionRate, trialCostToPlatform } = financials;

    `;

content = content.replace(oldFinancialBlockRegex, newFinancialBlock);

// Replace the overlap logic
const oldTeacherOverlap = /const otherStartMs = b\.startTime\.getTime\(\);\s*const otherEndMs = otherStartMs \+ b\.duration \* 60_000;\s*const hasOverlap = Math\.max\(requestedStartMs, otherStartMs\) < Math\.min\(requestedEndMs, otherEndMs\);/g;

content = content.replace(oldTeacherOverlap, "const hasOverlap = hasTimeOverlap(startTime, duration, b.startTime, b.duration);");

fs.writeFileSync(file, content);
console.log('Refactored create.ts');
