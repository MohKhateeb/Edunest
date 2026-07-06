const fs = require('fs');
const files = [
  'lib/actions/admin.ts',
  'lib/actions/admin/service-types.ts',
  'lib/actions/disputes.ts',
  'lib/actions/faq.ts',
  'lib/actions/notification.ts',
  'lib/actions/payout.ts',
  'lib/actions/teacher.ts',
  'lib/actions/details.ts'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('getErrorT(') && !content.includes('import { getErrorT')) {
      console.log('Missing import in: ' + f);
      // Let's add it right after use server
      content = content.replace(/"use server";\s*/g, '"use server";\nimport { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";\n');
      if (!content.includes('"use server";')) {
         content = 'import { getErrorT, getNotificationT } from "@/lib/i18n/get-server-translations";\n' + content;
      }
      fs.writeFileSync(f, content, 'utf8');
    }
  }
});
console.log('Done checking imports');
