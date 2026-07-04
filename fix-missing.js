const fs = require('fs');

// 1. AdminTeachersList.tsx missing `t`
let adminListPath = 'app/[locale]/dashboard/admin/_components/AdminTeachersList.tsx';
let adminContent = fs.readFileSync(adminListPath, 'utf8');
if (!adminContent.includes("useTranslations('admin')")) {
  adminContent = adminContent.replace(/export default function AdminTeachersList\({\n\tteachers,\n}: {\n\tteachers: Teacher\[\];\n}\) {/,
    "import { useTranslations } from 'next-intl';\n\nexport default function AdminTeachersList({\n\tteachers,\n}: {\n\tteachers: Teacher[];\n}) {\n\tconst t = useTranslations('admin');"
  );
  fs.writeFileSync(adminListPath, adminContent, 'utf8');
}

// 2. TeacherBookings ID page missing `getTranslations`
let teacherBookingPath = 'app/[locale]/dashboard/teacher/bookings/[id]/page.tsx';
let teacherBookingContent = fs.readFileSync(teacherBookingPath, 'utf8');
if (!teacherBookingContent.includes('import { getTranslations }')) {
  teacherBookingContent = 'import { getTranslations } from "next-intl/server";\n' + teacherBookingContent;
  fs.writeFileSync(teacherBookingPath, teacherBookingContent, 'utf8');
}

// 3. Teachers page missing `t`
let teachersPagePath = 'app/[locale]/teachers/page.tsx';
let teachersContent = fs.readFileSync(teachersPagePath, 'utf8');
if (!teachersContent.includes("const t = await getTranslations")) {
  teachersContent = teachersContent.replace(
    /export default async function TeachersPage\({\n\tsearchParams,\n}: {\n\tsearchParams: Promise<{ \[key: string\]: string \| string\[\] \| undefined }>;\n}\) {/,
    "export default async function TeachersPage({\n\tsearchParams,\n\tparams\n}: {\n\tsearchParams: Promise<{ [key: string]: string | string[] | undefined }>;\n\tparams: Promise<{ locale: string }>;\n}) {\n\tconst { locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });"
  );
  if (!teachersContent.includes('import { getTranslations }')) {
    teachersContent = 'import { getTranslations } from "next-intl/server";\n' + teachersContent;
  }
  fs.writeFileSync(teachersPagePath, teachersContent, 'utf8');
}

// 4. Teacher Slug page
let teacherSlugPath = 'app/[locale]/teachers/[slug]/page.tsx';
let slugContent = fs.readFileSync(teacherSlugPath, 'utf8');

if (!slugContent.includes('const t = await getTranslations')) {
  slugContent = slugContent.replace(
    /export async function generateMetadata\({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string }>;\n}\): Promise<Metadata> {\n\tconst { slug } = await params;/g,
    "export async function generateMetadata({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string; locale: string }>;\n}): Promise<Metadata> {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });"
  );

  slugContent = slugContent.replace(
    /export default async function TeacherProfilePage\({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string }>;\n}\) {\n\tconst { slug } = await params;/g,
    "export default async function TeacherProfilePage({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string; locale: string }>;\n}) {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });\n\tconst GRADE_LABELS = getGradeLabels(t);\n\tconst VERIFICATION_LABELS = getVerificationLabels(t);"
  );

  fs.writeFileSync(teacherSlugPath, slugContent, 'utf8');
}

console.log("Fixed missing variables");
