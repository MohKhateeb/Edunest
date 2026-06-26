const fs = require('fs');
const path = require('path');

const filesToPatch = [
  "app/dashboard/admin/bookings/page.tsx",
  "app/dashboard/admin/faq/page.tsx",
  "app/dashboard/admin/page.tsx",
  "app/dashboard/admin/services/page.tsx",
  "app/dashboard/admin/settings/homepage/page.tsx",
  "app/dashboard/admin/settings/page.tsx",
  "app/dashboard/admin/teachers/page.tsx",
  "app/dashboard/admin/users/page.tsx",
  "app/dashboard/admin/verification/page.tsx",
  "app/dashboard/parent/bookings/new/page.tsx",
  "app/dashboard/parent/bookings/page.tsx",
  "app/dashboard/parent/faq/page.tsx",
  "app/dashboard/parent/live/page.tsx",
  "app/dashboard/parent/page.tsx",
  "app/dashboard/parent/students/page.tsx",
  "app/dashboard/teacher/availability/page.tsx",
  "app/dashboard/teacher/bookings/page.tsx",
  "app/dashboard/teacher/faq/page.tsx",
  "app/dashboard/teacher/live/page.tsx",
  "app/dashboard/teacher/page.tsx",
  "app/dashboard/teacher/profile/page.tsx",
  "app/dashboard/teacher/services/page.tsx",
  "app/dashboard/teacher/verification/page.tsx"
];

const sharedFiles = [
  "app/dashboard/layout.tsx",
  "app/dashboard/profile/page.tsx",
  "app/dashboard/session/[id]/meet/page.tsx",
  "app/dashboard/session/[id]/page.tsx"
];

const allFiles = [...filesToPatch, ...sharedFiles];

allFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Determine role based on path
  let roleStr = "UserType.ADMIN, UserType.TEACHER, UserType.PARENT";
  if (file.includes("/admin/")) roleStr = "UserType.ADMIN";
  else if (file.includes("/teacher/")) roleStr = "UserType.TEACHER";
  else if (file.includes("/parent/")) roleStr = "UserType.PARENT";

  // Add imports if missing
  const requireAuthImport = `import { requireAuth } from '@/lib/require-auth';`;
  const userTypeImport = `import { UserType } from '@prisma/client';`;

  if (!content.includes('requireAuth')) {
    // Find the last import statement
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLastImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + requireAuthImport + '\n' + userTypeImport + '\n' + content.slice(endOfLastImport + 1);
    } else {
      content = requireAuthImport + '\n' + userTypeImport + '\n' + content;
    }
  }

  // Replace auth()
  const searchStr = "const session = await auth();";
  const replaceStr = `const session = await auth();\n  await requireAuth([${roleStr}]);`;

  if (content.includes(searchStr) && !content.includes(replaceStr)) {
    content = content.replace(searchStr, replaceStr);
    fs.writeFileSync(fullPath, content);
    console.log(`Patched ${file}`);
  }
});
