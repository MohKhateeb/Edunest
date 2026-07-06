const fs = require('fs');

// admin.ts
let admin = fs.readFileSync('lib/actions/admin.ts', 'utf8');
admin = admin.replace(/`تهانينا! لقد تم توثيق حسابك بمستوى: \$\{level\}`/g, 'await (async () => { const t = await getNotificationT(); return t("admin_verification_approved", { level }); })()');
admin = admin.replace(/`تم رفض طلب التوثيق للسبب التالي: \$\{reason\}`/g, 'await (async () => { const t = await getNotificationT(); return t("admin_verification_rejected", { reason }); })()');
admin = admin.replace(/"تخطيط ومحتوى الصفحة الرئيسية بتنسيق JSON الديناميكي"/g, 'await (async () => { const t = await getErrorT(); return t("admin_homepage_layout_desc"); })()');
fs.writeFileSync('lib/actions/admin.ts', admin, 'utf8');

// payout.ts
let payout = fs.readFileSync('lib/actions/payout.ts', 'utf8');
payout = payout.replace(/"بعض الجلسات المحددة غير صالحة للتسوية أو تم تسويتها مسبقاً\."/g, 'await (async () => { const t = await getErrorT(); return t("payout_invalid_sessions"); })()');
fs.writeFileSync('lib/actions/payout.ts', payout, 'utf8');

// booking-cleanup.ts
let cleanup = fs.readFileSync('lib/services/booking-cleanup.ts', 'utf8');
// match exact string literal
cleanup = cleanup.replace(/`نعتذر، لقد تم إلغاء جلستك تلقائياً نظراً لانتهاء وقتها دون تأكيد المعلم\.\$\{\s*isPaid \? " سيتم إرجاع المبلغ المدفوع لرصيدك في أقرب وقت\." : ""\s*\}`/g, 'await (async () => { const t = await getNotificationT(); return t("booking_auto_cancelled_message") + (isPaid ? t("booking_auto_cancelled_refund") : ""); })()');
fs.writeFileSync('lib/services/booking-cleanup.ts', cleanup, 'utf8');

// update ar.json and en.json
let arContent = fs.readFileSync('messages/ar.json', 'utf8');
let arData = JSON.parse(arContent);
arData.notifications.admin_verification_approved = "تهانينا! لقد تم توثيق حسابك بمستوى: {level}";
arData.notifications.admin_verification_rejected = "تم رفض طلب التوثيق للسبب التالي: {reason}";
arData.errors.admin_homepage_layout_desc = "تخطيط ومحتوى الصفحة الرئيسية بتنسيق JSON الديناميكي"; // actually this is a description for setting, but error t is okay as fallback
arData.errors.payout_invalid_sessions = "بعض الجلسات المحددة غير صالحة للتسوية أو تم تسويتها مسبقاً.";
fs.writeFileSync('messages/ar.json', JSON.stringify(arData, null, 2), 'utf8');

let enContent = fs.readFileSync('messages/en.json', 'utf8');
let enData = JSON.parse(enContent);
enData.notifications.admin_verification_approved = "Congratulations! Your account has been verified at level: {level}";
enData.notifications.admin_verification_rejected = "Your verification request was rejected for the following reason: {reason}";
enData.errors.admin_homepage_layout_desc = "Homepage layout and content in dynamic JSON format";
enData.errors.payout_invalid_sessions = "Some selected sessions are invalid for payout or have already been settled.";
fs.writeFileSync('messages/en.json', JSON.stringify(enData, null, 2), 'utf8');

console.log('Stragglers fixed');
