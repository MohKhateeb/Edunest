const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'lib/actions/admin.ts',
  'lib/actions/admin/service-types.ts',
  'lib/actions/disputes.ts',
  'lib/actions/faq.ts',
  'lib/actions/notification.ts',
  'lib/actions/payout.ts',
  'lib/actions/teacher.ts',
  'lib/actions/details.ts',
  'lib/auth/authorization.ts'
];

let arMap = {};
let counter = 1;

filesToProcess.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    
    // Zod messages replacement (no await getErrorT, just string keys)
    content = content.replace(/\.min\(([^,]+),\s*"([\u0600-\u06FF\s]+.*?)"\)/g, (match, p1, p2) => {
        const key = "zod_min_error_" + counter++;
        arMap[key] = p2;
        changed = true;
        return `.min(${p1}, "${key}")`;
    });
    content = content.replace(/\.max\(([^,]+),\s*"([\u0600-\u06FF\s]+.*?)"\)/g, (match, p1, p2) => {
        const key = "zod_max_error_" + counter++;
        arMap[key] = p2;
        changed = true;
        return `.max(${p1}, "${key}")`;
    });

    // General error returns / throws / error assignments
    content = content.replace(/error:\s*"([\u0600-\u06FF\s]+.*?)"/g, (match, p1) => {
        // Exclude specific history messages or db messages if any, but in these files there shouldn't be db history except disputeRepository.ts which we already handled
        const key = "action_error_" + counter++;
        arMap[key] = p1;
        changed = true;
        return `error: await (async () => { const t = await getErrorT(); return t("${key}"); })()`;
    });

    content = content.replace(/:\s*"([\u0600-\u06FF\s]+.*?)"/g, (match, p1) => {
        // Catch assignments like `err instanceof Error ? err.message : "حدث خطأ"`
        if (p1.includes("رسالة النظام") || p1.includes("رسالة إدارية") || p1.includes("مصادرة") || p1.includes("إلغاء تلقائي")) {
            return match; // ignore
        }
        const key = "action_error_" + counter++;
        arMap[key] = p1;
        changed = true;
        return `: await (async () => { const t = await getErrorT(); return t("${key}"); })()`;
    });

    if (changed) {
        if (!content.includes('getErrorT')) {
            content = 'import { getErrorT } from "@/lib/i18n/get-server-translations";\n' + content;
        }
        fs.writeFileSync(f, content, 'utf8');
        console.log('Processed', f);
    }
  }
});

fs.writeFileSync('batch2_extracted_ar.json', JSON.stringify(arMap, null, 2));
console.log('Extracted to batch2_extracted_ar.json');
