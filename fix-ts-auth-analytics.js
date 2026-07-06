const fs = require('fs');

// 1. Fix authorization.ts
let auth = fs.readFileSync('lib/auth/authorization.ts', 'utf8');
// remove the getErrorT import if we added it
auth = auth.replace(/import \{ getErrorT \} from "@\/lib\/i18n\/get-server-translations";\n/g, '');
// replace await async wrapper with just the key
auth = auth.replace(/await \(async \(\) => \{ const t = await getErrorT\(\); return t\("([^"]+)"\); \}\)\(\)/g, '"$1"');
fs.writeFileSync('lib/auth/authorization.ts', auth, 'utf8');

// 2. Fix analytics-repository.ts
let analytics = fs.readFileSync('lib/repositories/analytics-repository.ts', 'utf8');
// We have `message: await (async () => { const t = await getNotificationT(); return t("booking_report_warning_message"); })()` inside `ghostBookings.map`
// We should pull it out before map!
analytics = analytics.replace(/const urgentAlerts = ghostBookings\.map\(\(b\) => \(\{\n\s*id: `alert-\$\{b\.id\}`,\n\s*bookingId: b\.id,\n\s*type: b\.reportWarningLevel === 1 \? \("WARNING_1" as const\) : \("WARNING_2_FROZEN" as const\),\n\s*message: b\.reportWarningLevel === 1\n\s*\? await \(async \(\) => \{ const t = await getNotificationT\(\); return t\("booking_report_warning_message"\); \}\)\(\)\n\s*: await \(async \(\) => \{ const t = await getNotificationT\(\); return t\("booking_report_warning_final_message"\); \}\)\(\),\n\s*\}\)\);/g, 
`const tNotif = await getNotificationT();\n\t\tconst urgentAlerts = ghostBookings.map((b) => ({\n\t\t\tid: \`alert-\${b.id}\`,\n\t\t\tbookingId: b.id,\n\t\t\ttype: b.reportWarningLevel === 1 ? ("WARNING_1" as const) : ("WARNING_2_FROZEN" as const),\n\t\t\tmessage: b.reportWarningLevel === 1 ? tNotif("booking_report_warning_message") : tNotif("booking_report_warning_final_message"),\n\t\t}));`);

// We also have `name: await (async () => { const t = await getTranslations("common"); return t("grade_level", { grade: g.grade }); })()` inside `const gradeGroups = await prisma.student.groupBy({...}).map(g => ({ name: ... }))`?
// Wait, `gradeGroups.map(g => ({ name: await ... }))`. We must pull it out.
analytics = analytics.replace(/const studentGrades = gradeGroups\.map\(g => \(\{\n\s*name: await \(async \(\) => \{ const t = await getTranslations\("common"\); return t\("grade_level", \{ grade: g\.grade \}\); \}\)\(\),\n\s*value: g\._count\.grade,\n\s*\}\)\);/g, 
`const tCommon = await getTranslations("common");\n\t\tconst studentGrades = gradeGroups.map(g => ({\n\t\t\tname: tCommon("grade_level", { grade: g.grade }),\n\t\t\tvalue: g._count.grade,\n\t\t}));`);

fs.writeFileSync('lib/repositories/analytics-repository.ts', analytics, 'utf8');

console.log('Fixed TS errors in auth and analytics');
