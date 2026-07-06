const fs = require('fs');

let content = fs.readFileSync('lib/services/booking-cleanup.ts', 'utf8');

// Insert imports
if (!content.includes('getNotificationT')) {
    content = 'import { getNotificationT } from "@/lib/i18n/get-server-translations";\n' + content;
}

// Replace titles and messages sequentially
// 1. auto-cancelled
content = content.replace(/"إلغاء حجز تلقائي"/g, 'await (async () => { const t = await getNotificationT(); return t("booking_auto_cancelled_title"); })()');
content = content.replace(/`نعتذر، لقد تم إلغاء جلستك تلقائياً نظراً لانتهاء وقتها دون تأكيد المعلم\.\$\{[\s\S]*?isPaid \? " سيتم إرجاع المبلغ المدفوع لرصيدك في أقرب وقت\." : ""\n\t\t\t\t\t\t\}`/g, 
  'await (async () => { const t = await getNotificationT(); return t("booking_auto_cancelled_message") + (isPaid ? t("booking_auto_cancelled_refund") : ""); })()');

// 2. report penalty
content = content.replace(/"إلغاء جلسة ومصادرة الأرباح 🔴"/g, 'await (async () => { const t = await getNotificationT(); return t("booking_report_penalty_title"); })()');
content = content.replace(/`تم إغلاق جلستك تلقائياً نظراً لعدم تسليم التقرير لفترة تجاوزت 4 أيام\.`/g, 'await (async () => { const t = await getNotificationT(); return t("booking_report_penalty_message"); })()');

content = content.replace(/"إلغاء جلسة لعدم التزام المعلم بالتقرير"/g, 'await (async () => { const t = await getNotificationT(); return t("booking_report_penalty_parent_title"); })()');
content = content.replace(/`نعتذر، لم يقم المعلم بكتابة تقرير الجلسة\. تم حفظ حقوقك المالية وتُراجع الإدارة الموضوع الآن\.`/g, 'await (async () => { const t = await getNotificationT(); return t("booking_report_penalty_parent_message"); })()');

// 3. report warning final
content = content.replace(/"تحذير نهائي - تجميد أرباح ⚠️"/g, 'await (async () => { const t = await getNotificationT(); return t("booking_report_warning_final_title"); })()');
content = content.replace(/`أرباح جلستك محجوزة! أمامك وقت محدود لتقديم التقرير قبل مصادرة الجلسة نهائياً\.`/g, 'await (async () => { const t = await getNotificationT(); return t("booking_report_warning_final_message"); })()');

// 4. report warning
content = content.replace(/"تحذير: تقرير متأخر ⏳"/g, 'await (async () => { const t = await getNotificationT(); return t("booking_report_warning_title"); })()');
content = content.replace(/`لقد مضى 24 ساعة على انتهاء الجلسة ولم تقم بكتابة التقرير\. يرجى كتابته فوراً لتجنب تجميد الأرباح\.`/g, 'await (async () => { const t = await getNotificationT(); return t("booking_report_warning_message"); })()');

fs.writeFileSync('lib/services/booking-cleanup.ts', content, 'utf8');
console.log('booking-cleanup.ts updated');
