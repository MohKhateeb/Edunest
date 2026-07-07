const fs = require('fs');

let repo = fs.readFileSync('lib/repositories/analytics-repository.ts', 'utf8');

// 1. Update getTeacherDashboardOverview signature and toLocaleDateString
repo = repo.replace(/async getTeacherDashboardOverview\(teacherId: string, startDate: Date, endDate: Date\)\s*\{/, 'async getTeacherDashboardOverview(teacherId: string, startDate: Date, endDate: Date, locale: string = "ar") {');
repo = repo.replace(/toLocaleDateString\("ar-EG", \{ weekday: "short" \}\)/g, 'toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "short" })');

// 2. Update getAdminDashboardStats signature and toLocaleDateString
repo = repo.replace(/async getAdminDashboardStats\(startDate: Date, endDate: Date\)\s*\{/, 'async getAdminDashboardStats(startDate: Date, endDate: Date, locale: string = "ar") {');
repo = repo.replace(/toLocaleDateString\("ar-PS", \{ month: "short", day: "numeric" \}\)/g, 'toLocaleDateString(locale === "ar" ? "ar-PS" : "en-US", { month: "short", day: "numeric" })');

// 3. Fix SQL Grouping
repo = repo.replace(/\$\{await \(async \(\) => \{ const t = await getTranslations\("common"\); return t\("unspecified"\); \}\)\(\)\}/g, "'UNSPECIFIED'");

// 4. Update the specRaw mapping
repo = repo.replace(/const requestedSpecializations = specRaw\.map\(r => \(\{ name: r\.name, count: Number\(r\.count\) \}\)\);/, `const requestedSpecializations = specRaw.map(r => ({ 
			name: r.name === 'UNSPECIFIED' ? tCommon("unspecified") : r.name, 
			count: Number(r.count) 
		}));`);

// 5. Update the typeRaw mapping
repo = repo.replace(/const serviceTypeDistribution = typeRaw\.map\(r => \(\{ name: r\.name, count: Number\(r\.count\) \}\)\);/, `const serviceTypeDistribution = typeRaw.map(r => ({ 
			name: r.name === 'UNSPECIFIED' ? tCommon("unspecified") : r.name, 
			count: Number(r.count) 
		}));`);

fs.writeFileSync('lib/repositories/analytics-repository.ts', repo, 'utf8');

// 6. Update app/[locale]/dashboard/admin/page.tsx
let adminPage = fs.readFileSync('app/[locale]/dashboard/admin/page.tsx', 'utf8');
adminPage = adminPage.replace(/export default async function AdminDashboard\(\)\s*\{/, `export default async function AdminDashboard(props: { params: Promise<{ locale: string }> }) {\n    const params = await props.params;\n    const locale = params?.locale || "ar";`);
adminPage = adminPage.replace(/await analyticsRepository\.getAdminDashboardStats\(start, end\);/, 'await analyticsRepository.getAdminDashboardStats(start, end, locale);');
fs.writeFileSync('app/[locale]/dashboard/admin/page.tsx', adminPage, 'utf8');

// 7. Update app/[locale]/dashboard/teacher/page.tsx
let teacherPage = fs.readFileSync('app/[locale]/dashboard/teacher/page.tsx', 'utf8');
teacherPage = teacherPage.replace(/export default async function TeacherDashboard\(\)\s*\{/, `export default async function TeacherDashboard(props: { params: Promise<{ locale: string }> }) {\n    const params = await props.params;\n    const locale = params?.locale || "ar";`);
teacherPage = teacherPage.replace(/await analyticsRepository\.getTeacherDashboardOverview\(session\.user\.id, start, end\);/, 'await analyticsRepository.getTeacherDashboardOverview(session.user.id, start, end, locale);');
fs.writeFileSync('app/[locale]/dashboard/teacher/page.tsx', teacherPage, 'utf8');

console.log('Applied changes!');
