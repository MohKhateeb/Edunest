const fs = require('fs');

const filesToFix = [
  "app/(auth)/register/page.tsx",
  "app/dashboard/admin/faq/FAQAdminClient.tsx",
  "app/dashboard/admin/_components/AdminTeachersList.tsx",
  "app/dashboard/admin/_components/AdminVerificationQueue.tsx",
  "app/dashboard/parent/_components/ParentStudentsList.tsx",
  "components/shared/BookingCard.tsx",
  "components/shared/DisputeChat.tsx",
  "components/shared/FAQAccordion.tsx",
  "components/shared/NotificationBell.tsx"
];

const enumReplacements = {
  "VerificationLevel.NONE": '"NONE"',
  "VerificationLevel.BRONZE": '"BRONZE"',
  "VerificationLevel.SILVER": '"SILVER"',
  "VerificationLevel.GOLD": '"GOLD"',
  "FAQCategory.GENERAL": '"GENERAL"',
  "FAQCategory.TEACHER": '"TEACHER"',
  "FAQCategory.PARENT": '"PARENT"',
  "UserType.TEACHER": '"TEACHER"',
  "UserType.PARENT": '"PARENT"',
  "UserType.ADMIN": '"ADMIN"',
  "DisputeStatus.OPEN": '"OPEN"',
  "DisputeStatus.IN_PROGRESS": '"IN_PROGRESS"',
  "DisputeStatus.RESOLVED": '"RESOLVED"',
  "DisputeStatus.CLOSED": '"CLOSED"',
  "BookingStatus.PENDING": '"PENDING"',
  "BookingStatus.CONFIRMED": '"CONFIRMED"',
  "BookingStatus.COMPLETED": '"COMPLETED"',
  "BookingStatus.CANCELLED": '"CANCELLED"'
};

filesToFix.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log("File not found:", file);
    return;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace enum values with strings
  for (const [enumVal, strVal] of Object.entries(enumReplacements)) {
    if (content.includes(enumVal)) {
      content = content.split(enumVal).join(strVal);
      changed = true;
    }
  }

  // Ensure @prisma/client imports use `type`
  const prismaImportRegex = /import\s+\{([^}]+)\}\s+from\s+["']@prisma\/client["']/g;
  content = content.replace(prismaImportRegex, (match, p1) => {
    changed = true;
    return `import type {${p1}} from "@prisma/client"`;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log("Fixed", file);
  }
});
