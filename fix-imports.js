const fs = require('fs');
const path = require('path');

const files = [
  "lib/actions/bookings/cancel.ts",
  "lib/actions/bookings/accept.ts",
  "lib/actions/bookings/reject.ts",
  "lib/actions/bookings/pay.ts"
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Add import if not exists
  if (!content.includes('getAuthorizedBooking')) {
    content = content.replace("import { prisma } from '@/lib/prisma';", "import { prisma } from '@/lib/prisma';\nimport { getAuthorizedBooking } from '@/lib/services/booking-service';");
  }

  // 2. Fix requireAuth to include userType
  content = content.replace(/const { userId } = await requireAuth/g, "const { userId, userType } = await requireAuth");

  fs.writeFileSync(fullPath, content);
  console.log(`Fixed imports and userType in ${file}`);
});
