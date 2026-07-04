const fs = require('fs');

const filesToFix = [
  {
    path: 'app/[locale]/dashboard/admin/faq/page.tsx',
    fixes: [
      {
        find: /export const metadata: Metadata = {[\s\S]*?title: t\('(.+?)'\)\s*,[\s\S]*?description: t\('(.+?)'\)\s*,[\s\S]*?};/,
        replace: `export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {\n\tconst { locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'admin' });\n\treturn {\n\t\ttitle: t('$1'),\n\t\tdescription: t('$2'),\n\t};\n}`
      }
    ]
  },
  {
    path: 'app/[locale]/dashboard/parent/faq/page.tsx',
    fixes: [
      {
        find: /export const metadata: Metadata = {[\s\S]*?title: t\('(.+?)'\)\s*,[\s\S]*?description: t\('(.+?)'\)\s*,[\s\S]*?};/,
        replace: `export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {\n\tconst { locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'parent' });\n\treturn {\n\t\ttitle: t('$1'),\n\t\tdescription: t('$2'),\n\t};\n}`
      }
    ]
  },
  {
    path: 'app/[locale]/dashboard/teacher/faq/page.tsx',
    fixes: [
      {
        find: /export const metadata: Metadata = {[\s\S]*?title: t\('(.+?)'\)\s*,[\s\S]*?description: t\('(.+?)'\)\s*,[\s\S]*?};/,
        replace: `export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {\n\tconst { locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });\n\treturn {\n\t\ttitle: t('$1'),\n\t\tdescription: t('$2'),\n\t};\n}`
      }
    ]
  },
  {
    path: 'app/[locale]/dashboard/admin/financials/_components/FinancialTabs.tsx',
    fixes: [
      {
        find: /const tabs = \[[\s\S]*?\];/,
        replace: `const getTabs = (t: ReturnType<typeof useTranslations>) => [\n\t{ id: "overview", label: t('key_1783109439387_fkhc'), icon: Activity },\n\t{ id: "revenue", label: t('key_1783109434023_f2go'), icon: TrendingUp },\n\t{ id: "payouts", label: t('key_1783109439390_h1o3'), icon: BadgeDollarSign },\n\t{ id: "escrow", label: t('key_1783109439390_4o2q'), icon: ShieldAlert },\n];`
      },
      {
        find: /export default function FinancialTabs\(\) {/,
        replace: `import { useMemo } from 'react';\n\nexport default function FinancialTabs() {`
      },
      {
        find: /const t = useTranslations\('admin'\)/,
        replace: `const t = useTranslations('admin');\n\tconst tabs = useMemo(() => getTabs(t), [t]);`
      }
    ]
  },
  {
    path: 'app/[locale]/dashboard/admin/_components/AdminTeachersList.tsx',
    fixes: [
      {
        find: /teachers\.filter\(\(t\) => {/g,
        replace: `teachers.filter((teacher) => {`
      },
      {
        find: /renderRow={\(t\) => {/g,
        replace: `renderRow={(teacher) => {`
      },
      {
        find: /t\.user/g,
        replace: `teacher.user`
      },
      {
        find: /t\.id/g,
        replace: `teacher.id`
      },
      {
        find: /t\.profileImageUrl/g,
        replace: `teacher.profileImageUrl`
      },
      {
        find: /t\.specialization/g,
        replace: `teacher.specialization`
      },
      {
        find: /t\.averageRating/g,
        replace: `teacher.averageRating`
      },
      {
        find: /t\.totalReviews/g,
        replace: `teacher.totalReviews`
      },
      {
        find: /t\.verificationLevel/g,
        replace: `teacher.verificationLevel`
      }
    ]
  },
  {
    path: 'app/[locale]/teachers/page.tsx',
    fixes: [
      {
        find: /teachers\.map\(\(t\) => {/g,
        replace: `teachers.map((teacher) => {`
      },
      {
        find: /t\.id/g,
        replace: `teacher.id`
      },
      {
        find: /t\.slug/g,
        replace: `teacher.slug`
      },
      {
        find: /t\.profileImageUrl/g,
        replace: `teacher.profileImageUrl`
      },
      {
        find: /t\.user/g,
        replace: `teacher.user`
      },
      {
        find: /t\.verificationLevel/g,
        replace: `teacher.verificationLevel`
      },
      {
        find: /t\.subjects/g,
        replace: `teacher.subjects`
      },
      {
        find: /t\.subSpecialization/g,
        replace: `teacher.subSpecialization`
      },
      {
        find: /t\.city/g,
        replace: `teacher.city`
      },
      {
        find: /t\.area/g,
        replace: `teacher.area`
      },
      {
        find: /t\.gradeLevels/g,
        replace: `teacher.gradeLevels`
      },
      {
        find: /t\.averageRating/g,
        replace: `teacher.averageRating`
      },
      {
        find: /t\.totalReviews/g,
        replace: `teacher.totalReviews`
      },
      {
        find: /t\.services/g,
        replace: `teacher.services`
      }
    ]
  }
];

filesToFix.forEach(fileDef => {
  if (fs.existsSync(fileDef.path)) {
    let content = fs.readFileSync(fileDef.path, 'utf8');
    fileDef.fixes.forEach(fix => {
      content = content.replace(fix.find, fix.replace);
    });
    fs.writeFileSync(fileDef.path, content, 'utf8');
    console.log('Fixed', fileDef.path);
  }
});
