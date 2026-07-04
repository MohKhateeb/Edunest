const fs = require('fs');

function runFix() {
  const file1 = 'app/[locale]/teachers/page.tsx';
  let content1 = fs.readFileSync(file1, 'utf8');

  // Fix imports
  if (!content1.includes('getTranslations')) {
    content1 = 'import { getTranslations } from "next-intl/server";\n' + content1;
  }
  
  // Replace Arabic texts
  content1 = content1.replace(/>لم نتمكن من العثور على معلمين</g, ">{t('key_1783109427736_99ff')}<");
  content1 = content1.replace(/>جرب تعديل عوامل التصفية أو البحث بكلمات مختلفة.</g, ">{t('key_1783109427747_43fd')}<");
  content1 = content1.replace(/>مسح التصفية</g, ">{t('key_1783109427760_qcyq')}<");
  content1 = content1.replace(/"غير محدد"/g, "t('ghyr_mhdd')");
  content1 = content1.replace(/>الصفوف:</g, ">{t('key_1783109427774_cfcr')}<");
  content1 = content1.replace(/>من </g, ">{t('mn')}<");
  content1 = content1.replace(/>إعادة المحاولة</g, ">{t('key_1783109427722_yuwk')}<");

  // Fix shadowing
  content1 = content1.replace(/teachers\.map\(\(t\) => {/g, "teachers.map((teacher) => {");
  content1 = content1.replace(/t\.id/g, "teacher.id");
  content1 = content1.replace(/t\.slug/g, "teacher.slug");
  content1 = content1.replace(/t\.profileImageUrl/g, "teacher.profileImageUrl");
  content1 = content1.replace(/t\.user/g, "teacher.user");
  content1 = content1.replace(/t\.verificationLevel/g, "teacher.verificationLevel");
  content1 = content1.replace(/t\.subjects/g, "teacher.subjects");
  content1 = content1.replace(/t\.subSpecialization/g, "teacher.subSpecialization");
  content1 = content1.replace(/t\.city/g, "teacher.city");
  content1 = content1.replace(/t\.area/g, "teacher.area");
  content1 = content1.replace(/t\.gradeLevels/g, "teacher.gradeLevels");
  content1 = content1.replace(/t\.averageRating/g, "teacher.averageRating");
  content1 = content1.replace(/t\.totalReviews/g, "teacher.totalReviews");
  content1 = content1.replace(/t\.services/g, "teacher.services");

  // Inject t
  content1 = content1.replace(
    "export default async function TeachersPage({\n\tsearchParams,\n}: {\n\tsearchParams: Promise<SearchParams>;\n}) {\n\tconst params = await searchParams;",
    "export default async function TeachersPage({\n\tsearchParams,\n\tparams\n}: {\n\tsearchParams: Promise<SearchParams>;\n\tparams: Promise<{ locale: string }>;\n}) {\n\tconst { locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });\n\tconst resolvedSearchParams = await searchParams;"
  );
  content1 = content1.replace(
    "const { teachers, total, page, PAGE_SIZE } = await getTeachers(params);",
    "const { teachers, total, page, PAGE_SIZE } = await getTeachers(resolvedSearchParams);"
  );
  content1 = content1.replace(
    "subject: params.subject,\n\t\t\tcity: params.city,",
    "subject: resolvedSearchParams.subject,\n\t\t\tcity: resolvedSearchParams.city,"
  );

  fs.writeFileSync(file1, content1, 'utf8');

  // Next file
  const file2 = 'app/[locale]/teachers/[slug]/page.tsx';
  let content2 = fs.readFileSync(file2, 'utf8');

  if (!content2.includes('getTranslations')) {
    content2 = 'import { getTranslations } from "next-intl/server";\n' + content2;
  }

  // Replace Arabic texts
  content2 = content2.replace(/1: "الأول",/g, "1: t('key_1783109427957_e53t') ,");
  content2 = content2.replace(/2: "الثاني",/g, "2: t('key_1783109427963_de9z') ,");
  content2 = content2.replace(/3: "الثالث",/g, "3: t('key_1783109427968_jq6s') ,");
  content2 = content2.replace(/4: "الرابع",/g, "4: t('key_1783109427987_kasc') ,");
  content2 = content2.replace(/5: "الخامس",/g, "5: t('key_1783109427993_569z') ,");
  content2 = content2.replace(/6: "السادس",/g, "6: t('key_1783109427998_8ikp') ,");
  content2 = content2.replace(/7: "السابع",/g, "7: t('key_1783109428004_vcdi') ,");
  content2 = content2.replace(/8: "الثامن",/g, "8: t('key_1783109428009_ffra') ,");
  content2 = content2.replace(/9: "التاسع",/g, "9: t('key_1783109428016_rsv5') ,");
  content2 = content2.replace(/10: "العاشر",/g, "10: t('key_1783109428022_dg13') ,");
  content2 = content2.replace(/11: "الحادي عشر",/g, "11: t('key_1783109428028_5si7') ,");
  content2 = content2.replace(/12: "الثاني عشر",\n};/g, "12: t('key_1783109428033_85m6') ,\n});");
  content2 = content2.replace(/BRONZE: "🥉 برونزي",/g, "BRONZE: t('key_1783109429415_wbip') ,");
  content2 = content2.replace(/SILVER: "🥈 فضي",/g, "SILVER: t('key_1783109429422_1ndn') ,");
  content2 = content2.replace(/GOLD: "🥇 ذهبي",\n};/g, "GOLD: t('key_1783109429429_v3ds') ,\n});");
  content2 = content2.replace(/title: "معلم غير موجود"/g, "title: t('key_1783109429440_svyo')");
  content2 = content2.replace(/"غير محدد"/g, "t('ghyr_mhdd')");
  content2 = content2.replace(/"غير معروف"/g, "t('key_1783109429460_z0kk')");

  // Fix LABELS
  content2 = content2.replace("const GRADE_LABELS: Record<number, string> = {", "const getGradeLabels = (t: any): Record<number, string> => ({");
  content2 = content2.replace("const VERIFICATION_LABELS: Record<string, string> = {", "const getVerificationLabels = (t: any): Record<string, string> => ({");

  // Fix generateMetadata
  content2 = content2.replace(
    "export async function generateMetadata({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string }>;\n}): Promise<Metadata> {\n\tconst { slug } = await params;",
    "export async function generateMetadata({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string; locale: string }>;\n}): Promise<Metadata> {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });"
  );

  // Fix TeacherProfilePage
  content2 = content2.replace(
    "export default async function TeacherProfilePage({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string }>;\n}) {\n\tconst { slug } = await params;",
    "export default async function TeacherProfilePage({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string; locale: string }>;\n}) {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });\n\tconst GRADE_LABELS = getGradeLabels(t);\n\tconst VERIFICATION_LABELS = getVerificationLabels(t);"
  );

  fs.writeFileSync(file2, content2, 'utf8');
}

runFix();
console.log("Done");
