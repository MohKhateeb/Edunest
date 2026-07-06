const fs = require('fs');

let content = fs.readFileSync('lib/repositories/disputeRepository.ts', 'utf8');

if (!content.includes('getNotificationT')) {
    content = 'import { getNotificationT } from "@/lib/i18n/get-server-translations";\n' + content;
}

content = content.replace(/"اعتراض جديد ⚠️"/g, 'await (async () => { const t = await getNotificationT(); return t("dispute_new_title"); })()');
content = content.replace(/"قام ولي الأمر برفع اعتراض على جلستك الأخيرة\. تم تجميد مستحقات الجلسة مؤقتاً\."/g, 'await (async () => { const t = await getNotificationT(); return t("dispute_new_message"); })()');

content = content.replace(/"قرار بشأن اعتراضك"/g, 'await (async () => { const t = await getNotificationT(); return t("dispute_decision_title"); })()');
content = content.replace(/"تم حل الاعتراض لصالحك وجاري إرجاع المبلغ\."/g, 'await (async () => { const t = await getNotificationT(); return t("dispute_decision_won_message"); })()');
content = content.replace(/"تم رفض الاعتراض بعد المراجعة\. راجع المحادثة للتفاصيل\."/g, 'await (async () => { const t = await getNotificationT(); return t("dispute_decision_lost_message"); })()');

content = content.replace(/"إغلاق النزاع المالي"/g, 'await (async () => { const t = await getNotificationT(); return t("dispute_closed_title"); })()');
content = content.replace(/"تم الحكم بصالحك في النزاع الأخير، وسيضاف الرصيد لدفعاتك القادمة\."/g, 'await (async () => { const t = await getNotificationT(); return t("dispute_closed_won_message"); })()');
content = content.replace(/"تم قبول اعتراض ولي الأمر واسترداد مبلغ الجلسة\."/g, 'await (async () => { const t = await getNotificationT(); return t("dispute_closed_lost_message"); })()');

fs.writeFileSync('lib/repositories/disputeRepository.ts', content, 'utf8');
console.log('disputeRepository updated');
