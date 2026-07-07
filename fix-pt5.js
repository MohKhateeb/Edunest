const fs = require('fs');

let analytics = fs.readFileSync('lib/utils/admin-analytics.ts', 'utf8');

if (!analytics.includes('BOOKING_STATUS_AR')) {
  analytics = 'import { BOOKING_STATUS_AR } from "@/lib/translations";\n' + analytics;
}

const lines = analytics.split('\n');
const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('const statusMap: Record<string, string> = {')) {
    skip = true;
    continue;
  }
  
  if (skip && line.includes('};')) {
    skip = false;
    continue;
  }
  
  if (skip) continue;
  
  let modified = line;
  modified = modified.replace('name: statusMap[status] || status', 'name: BOOKING_STATUS_AR[status as keyof typeof BOOKING_STATUS_AR] || status');
  modified = modified.replace('const spec = "غير محدد";', 'const spec = "UNSPECIFIED";');
  modified = modified.replace('const type = b.teacherService?.serviceType?.name || "غير محدد";', 'const type = b.teacherService?.serviceType?.name || "UNSPECIFIED";');
  
  newLines.push(modified);
}

fs.writeFileSync('lib/utils/admin-analytics.ts', newLines.join('\n'), 'utf8');
console.log('Fixed admin-analytics.ts');
