const fs = require('fs');

// 1. Fix create.ts notifications
let create = fs.readFileSync('lib/actions/tutoring-requests/create.ts', 'utf8');
create = create.replace(/await \(async \(\) => \{ const t = await getNotificationT\(\); return t\("instant_request_new_title"\); \}\)\(\)/g, 'tNotif("instant_request_new_title")');
create = create.replace(/await \(async \(\) => \{ const t = await getNotificationT\(\); return t\("instant_request_new_message", \{ studentName: student\.name, studentGrade: student\.grade, priceFormatted: formatCurrency\(price\), duration \}\); \}\)\(\)/g, 'tNotif("instant_request_new_message", { studentName: student.name, studentGrade: student.grade, priceFormatted: formatCurrency(price), duration })');
// Inject tNotif before the map
create = create.replace(/if \(matchingTeachers\.length > 0\) \{/g, 'if (matchingTeachers.length > 0) {\n\t\t\tconst tNotif = await getNotificationT();');
fs.writeFileSync('lib/actions/tutoring-requests/create.ts', create, 'utf8');

// 2. Fix availability.ts
let avail = fs.readFileSync('lib/actions/availability.ts', 'utf8');
avail = avail.replace(/err instanceof Error \? err\.message : await \(async \(\) => \{ const t = await getErrorT\(\); return t\("availability_update_error"\); \}\)\(\);/g, 
  "err instanceof Error ? err.message : await (async () => { const t = await getErrorT(); return t('availability_update_error'); })()");
fs.writeFileSync('lib/actions/availability.ts', avail, 'utf8');

console.log("Fixes 2 applied");
