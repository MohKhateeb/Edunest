const fs = require('fs');

let content = fs.readFileSync('lib/services/booking-service.ts', 'utf8');

if (!content.includes('getErrorT')) {
    content = 'import { getErrorT } from "@/lib/i18n/get-server-translations";\n' + content;
}

content = content.replace(/"الحجز غير موجود أو غير متاح"/g, 'await (async () => { const t = await getErrorT(); return t("booking_not_found_or_unavailable"); })()');
content = content.replace(/"غير مصرح لك بإجراء تعديلات على هذا الحجز"/g, 'await (async () => { const t = await getErrorT(); return t("booking_unauthorized_edit"); })()');

fs.writeFileSync('lib/services/booking-service.ts', content, 'utf8');
console.log('booking-service updated');
