const fs = require('fs');

let content = fs.readFileSync('lib/repositories/analytics-repository.ts', 'utf8');

if (!content.includes('getNotificationT')) {
    content = 'import { getNotificationT, getTranslations } from "@/lib/i18n/get-server-translations";\n' + content;
}
if (!content.includes('BOOKING_STATUS_AR')) {
    content = 'import { BOOKING_STATUS_AR } from "@/lib/translations";\n' + content;
}

// 1. warnings
content = content.replace(/"تحذير: توجد جلسة مر على انتهائها أكثر من 24 ساعة ولم تكتب التقرير\. يرجى كتابته فوراً لتجنب تجميد الأرباح\."/g, 'await (async () => { const t = await getNotificationT(); return t("booking_report_warning_message"); })()');
content = content.replace(/"تحذير أخير: أرباح جلسة سابقة أصبحت مجمدة نظراً لعدم كتابتك التقرير\. الجلسة مهددة بالمصادرة إذا لم تقم بكتابة التقرير\."/g, 'await (async () => { const t = await getNotificationT(); return t("booking_report_warning_final_message"); })()');

// 2. Status map
content = content.replace(/const statusMap: Record<string, string> = \{\s*COMPLETED: "مكتمل", CONFIRMED: "مؤكد", PENDING: "معلق", CANCELLED: "ملغي", REJECTED: "مرفوض", PENDING_APPROVAL: "بانتظار الموافقة", AWAITING_PAYMENT: "بانتظار الدفع",\s*\};/g, 
  'const statusMap: Record<string, string> = BOOKING_STATUS_AR;');

// 3. unspecified in sql
// We have `COALESCE(s.name, 'غير محدد')` and `COALESCE(st.name, 'غير محدد')`
// And `` الصف ${g.grade} ``
content = content.replace(/'غير محدد'/g, '${await (async () => { const t = await getTranslations("common"); return t("unspecified"); })()}');
content = content.replace(/`الصف \$\{g\.grade\}`/g, 'await (async () => { const t = await getTranslations("common"); return t("grade_level", { grade: g.grade }); })()');

fs.writeFileSync('lib/repositories/analytics-repository.ts', content, 'utf8');

// session-service.ts
let sessionContent = fs.readFileSync('lib/services/domain/session-service.ts', 'utf8');
if (!sessionContent.includes('getTranslations')) {
    sessionContent = 'import { getTranslations } from "@/lib/i18n/get-server-translations";\n' + sessionContent;
}
sessionContent = sessionContent.replace(/"غير محدد"/g, 'await (async () => { const t = await getTranslations("common"); return t("unspecified"); })()');
fs.writeFileSync('lib/services/domain/session-service.ts', sessionContent, 'utf8');

// system-admin-service.ts
let adminContent = fs.readFileSync('lib/services/domain/system-admin-service.ts', 'utf8');
if (!adminContent.includes('getTranslations')) {
    adminContent = 'import { getTranslations } from "@/lib/i18n/get-server-translations";\n' + adminContent;
}
adminContent = adminContent.replace(/"غير محدد"/g, 'await (async () => { const t = await getTranslations("common"); return t("unspecified"); })()');
fs.writeFileSync('lib/services/domain/system-admin-service.ts', adminContent, 'utf8');

console.log('Analytics and services updated');
