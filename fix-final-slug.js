const fs = require('fs');

const path = 'app/[locale]/teachers/[slug]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { getTranslations }')) {
  content = 'import { getTranslations } from "next-intl/server";\n' + content;
}

// Arabic replacements
content = content.replace(/1: "الأول",/g, "1: t('key_1783109427957_e53t') ,");
content = content.replace(/2: "الثاني",/g, "2: t('key_1783109427963_de9z') ,");
content = content.replace(/3: "الثالث",/g, "3: t('key_1783109427968_jq6s') ,");
content = content.replace(/4: "الرابع",/g, "4: t('key_1783109427987_kasc') ,");
content = content.replace(/5: "الخامس",/g, "5: t('key_1783109427993_569z') ,");
content = content.replace(/6: "السادس",/g, "6: t('key_1783109427998_8ikp') ,");
content = content.replace(/7: "السابع",/g, "7: t('key_1783109428004_vcdi') ,");
content = content.replace(/8: "الثامن",/g, "8: t('key_1783109428009_ffra') ,");
content = content.replace(/9: "التاسع",/g, "9: t('key_1783109428016_rsv5') ,");
content = content.replace(/10: "العاشر",/g, "10: t('key_1783109428022_dg13') ,");
content = content.replace(/11: "الحادي عشر",/g, "11: t('key_1783109428028_5si7') ,");
content = content.replace(/12: "الثاني عشر",\r?\n};/g, "12: t('key_1783109428033_85m6') ,\n});");
content = content.replace(/BRONZE: "🥉 برونزي",/g, "BRONZE: t('key_1783109429415_wbip') ,");
content = content.replace(/SILVER: "🥈 فضي",/g, "SILVER: t('key_1783109429422_1ndn') ,");
content = content.replace(/GOLD: "🥇 ذهبي",\r?\n};/g, "GOLD: t('key_1783109429429_v3ds') ,\n});");
content = content.replace(/title: "معلم غير موجود"/g, "title: t('key_1783109429440_svyo')");
content = content.replace(/"غير محدد"/g, "t('ghyr_mhdd')");
content = content.replace(/"غير معروف"/g, "t('key_1783109429460_z0kk')");

content = content.replace("const GRADE_LABELS: Record<number, string> = {", "const getGradeLabels = (t: any): Record<number, string> => ({");
content = content.replace("const VERIFICATION_LABELS: Record<string, string> = {", "const getVerificationLabels = (t: any): Record<string, string> => ({");

content = content.replace(
  /export async function generateMetadata\(\{[\s\S]*?params,[\s\S]*?\}\: \{[\s\S]*?params\: Promise<\{ slug\: string \}>;[\s\S]*?\}\)\: Promise<Metadata> \{[\s\S]*?const \{ slug \} = await params;/m,
  "export async function generateMetadata({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string; locale: string }>;\n}): Promise<Metadata> {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });"
);

content = content.replace(
  /export default async function TeacherProfilePage\(\{[\s\S]*?params,[\s\S]*?\}\: \{[\s\S]*?params\: Promise<\{ slug\: string \}>;[\s\S]*?\}\) \{[\s\S]*?const \{ slug \} = await params;/m,
  "export default async function TeacherProfilePage({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string; locale: string }>;\n}) {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });\n\tconst GRADE_LABELS = getGradeLabels(t);\n\tconst VERIFICATION_LABELS = getVerificationLabels(t);"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed slug page properly");
