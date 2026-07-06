const fs = require('fs');

let wrapper = fs.readFileSync('lib/action-wrapper.ts', 'utf8');
wrapper = wrapper.replace(/, undefined, \{ fallback: err\.message \}/g, '');
fs.writeFileSync('lib/action-wrapper.ts', wrapper, 'utf8');

let analytics = fs.readFileSync('lib/repositories/analytics-repository.ts', 'utf8');
analytics = analytics.replace(/await \(async \(\) => \{ const t = await getTranslations\("common"\); return t\("grade_level", \{ grade: g\.grade \}\); \}\)\(\)/g, 'tCommon("grade_level", { grade: g.grade })');

// add tCommon at the top of getAdminDashboardData
if (!analytics.includes('const tCommon = await getTranslations("common");')) {
    analytics = analytics.replace(/export async function getAdminDashboardData/, 'export async function getAdminDashboardData');
    analytics = analytics.replace(/const totalBookings = await prisma\.booking\.count\(\{/, 'const tCommon = await getTranslations("common");\n\t\tconst totalBookings = await prisma.booking.count({');
}

fs.writeFileSync('lib/repositories/analytics-repository.ts', analytics, 'utf8');
console.log('Fixed final TS errors');
