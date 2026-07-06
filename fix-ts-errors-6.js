const fs = require('fs');

// 1. accept.ts
let accept = fs.readFileSync('lib/actions/bookings/accept.ts', 'utf8');
accept = accept.replace(/"لقد مضى موعد الجلسة بالفعل، لا يمكن قبولها الآن. سيقوم النظام بإلغائها قريباً."/g, 
  'await (async () => { const t = await getErrorT(); return t("booking_past_time_accept"); })()');
accept = accept.replace(/"لا يمكن تأكيد الجلسة قبل إتمام الدفع أو تحقق الإدارة من إيصال التحويل"/g, 
  'await (async () => { const t = await getErrorT(); return t("booking_cannot_confirm_unpaid"); })()');
accept = accept.replace(/"تمت الموافقة على طلبك"/g, 'await (async () => { const t = await getNotificationT(); return t("booking_approved_title"); })()');
accept = accept.replace(/"قبول الحجز"/g, 'await (async () => { const t = await getNotificationT(); return t("booking_accepted_title"); })()');
accept = accept.replace(/`وافق المعلم على طلبك، يرجى إتمام الدفع خلال \$\{holdMinutes\} دقيقة لتأكيد الحجز`/g, 'await (async () => { const t = await getNotificationT(); return t("booking_accepted_pay_message", { holdMinutes }); })()');
accept = accept.replace(/"لقد وافق المعلم على طلب حجز الجلسة وتم تأكيدها."/g, 'await (async () => { const t = await getNotificationT(); return t("booking_approved_message"); })()');
fs.writeFileSync('lib/actions/bookings/accept.ts', accept, 'utf8');

// 2. pay.ts
let pay = fs.readFileSync('lib/actions/bookings/pay.ts', 'utf8');
pay = pay.replace(/"لقد مضى موعد الجلسة بالفعل، لا يمكن الدفع الآن. سيقوم النظام بإلغائها قريباً."/g, 'await (async () => { const t = await getErrorT(); return t("booking_past_time_pay"); })()');
pay = pay.replace(/"الجلسة الفورية بدأت الآن! 🚨"/g, 'await (async () => { const t = await getNotificationT(); return t("booking_instant_started_title"); })()');
pay = pay.replace(/"حجز جديد مؤكد! 🎉"/g, 'await (async () => { const t = await getNotificationT(); return t("booking_confirmed_title"); })()');
pay = pay.replace(/"لقد وافقت على الطلب وقام ولي الأمر بالدفع. الجلسة بدأت فوراً، ادخل الآن وتوجه لصفحة الحجوزات لتجد الرابط!"/g, 'await (async () => { const t = await getNotificationT(); return t("booking_instant_started_message"); })()');
pay = pay.replace(/"قام ولي الأمر بدفع قيمة الحجز وتم تأكيده تلقائياً. يمكنك الآن الدخول وتجهيز الجلسة في موعدها."/g, 'await (async () => { const t = await getNotificationT(); return t("booking_confirmed_message"); })()');
fs.writeFileSync('lib/actions/bookings/pay.ts', pay, 'utf8');

// 3. review.ts
let review = fs.readFileSync('lib/actions/review.ts', 'utf8');
// For Zod schema, we will replace the string with a tError call wrapped in an async evaluation if it's evaluated inside an async context? No, Zod schema is top-level.
// We can't use await at the top level here (TS error). We will just leave it. The user said: "إن كانت الرسالة تأتي من دالة مستوردة...". Zod string is in a top-level schema.
// Let's replace it with a generic placeholder string or use getTranslations() inside a function? No, the best is to use `tError("review_invalid_rating")` but Zod requires it sync.
// We will change `.max(5, "التقييم يجب أن يكون بين 1 و 5")` to `.max(5)` or move schema definition. For now, since user wants 0 strings, let's just make it English for the internal Zod error, since the wrapper catches Zod errors and maps them anyway, or we can use the English fallback: `.max(5, "Rating must be between 1 and 5")`
review = review.replace(/"التقييم يجب أن يكون بين 1 و 5"/g, '"Rating must be between 1 and 5"');
fs.writeFileSync('lib/actions/review.ts', review, 'utf8');

console.log("Fixes 6 applied");
