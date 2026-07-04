const fs = require('fs');

const path = 'app/[locale]/teachers/[slug]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add getTranslations import if not present
if (!content.includes('import { getTranslations }')) {
  content = 'import { getTranslations } from "next-intl/server";\n' + content;
}

// 2. Fix generateMetadata
content = content.replace(
  /export async function generateMetadata\(\{[\s\S]*?params,[\s\S]*?\}\: \{[\s\S]*?params\: Promise<\{ slug\: string \}>;[\s\S]*?\}\)\: Promise<Metadata> \{[\s\S]*?const \{ slug \} = await params;/m,
  "export async function generateMetadata({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string; locale: string }>;\n}): Promise<Metadata> {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });"
);

// 3. Fix TeacherProfilePage
content = content.replace(
  /export default async function TeacherProfilePage\(\{[\s\S]*?params,[\s\S]*?\}\: \{[\s\S]*?params\: Promise<\{ slug\: string \}>;[\s\S]*?\}\) \{[\s\S]*?const \{ slug \} = await params;/m,
  "export default async function TeacherProfilePage({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string; locale: string }>;\n}) {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });\n\tconst GRADE_LABELS = getGradeLabels(t);\n\tconst VERIFICATION_LABELS = getVerificationLabels(t);"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed slug page");
