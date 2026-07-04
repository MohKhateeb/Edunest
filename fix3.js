const fs = require('fs');

const path = 'app/[locale]/teachers/[slug]/page.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Fix GRADE_LABELS
  content = content.replace(/const GRADE_LABELS: Record<number, string> = {/g, 'const getGradeLabels = (t: any): Record<number, string> => ({');
  content = content.replace(/12: t\('key_1783109428033_85m6'\) ,\n};/g, "12: t('key_1783109428033_85m6') ,\n});");

  // Fix VERIFICATION_LABELS
  content = content.replace(/const VERIFICATION_LABELS: Record<string, string> = {/g, 'const getVerificationLabels = (t: any): Record<string, string> => ({');
  content = content.replace(/GOLD: t\('key_1783109429429_v3ds'\) ,\n};/g, "GOLD: t('key_1783109429429_v3ds') ,\n});");

  // Fix generateMetadata
  content = content.replace(
    /params: Promise<{ slug: string }>;\n}\): Promise<Metadata> {\n    const t = await getTranslations\('teachers'\)\n\tconst { slug } = await params;/g,
    "params: Promise<{ slug: string; locale: string }>;\n}): Promise<Metadata> {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });"
  );

  // Fix TeacherProfilePage
  content = content.replace(
    /export default async function TeacherProfilePage\({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string }>;\n}\) {\n\tconst { slug } = await params;/g,
    "export default async function TeacherProfilePage({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string; locale: string }>;\n}) {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });\n\tconst GRADE_LABELS = getGradeLabels(t);\n\tconst VERIFICATION_LABELS = getVerificationLabels(t);"
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log('Fixed', path);
}
