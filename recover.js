const fs = require('fs');

const filesToRecover = [
  {
    path: 'app/[locale]/dashboard/admin/_components/AdminTeachersList.tsx',
    namespace: 'admin',
    replacements: [
      { find: /emptyMessage="لا توجد نتائج مطابقة للبحث."/, replace: "emptyMessage={t('str_2YTYpyDY')}" },
      { find: /"المعلم"/, replace: "t('key_1783109431646_z8fy')" },
      { find: /"البريد الإلكتروني"/, replace: "t('key_1783109431649_3qcs')" },
      { find: /"التقييم"/, replace: "t('key_1783109431652_uexs')" },
      { find: /"التوثيق"/, replace: "t('key_1783109431655_7bo3')" },
      { find: /"الإجراء"/, replace: "t('key_1783109431658_bm66')" },
      { find: /searchPlaceholder="ابحث بالاسم أو البريد الإلكتروني..."/, replace: "searchPlaceholder={t('key_1783109431664_hsq5')}" },
      { find: />الكل \(التوثيق\)</, replace: ">{t('key_1783109431569_27gk')}<" },
      { find: />غير موثق</, replace: ">{t('key_1783109431578_3ocp')}<" },
      { find: />برونزي</, replace: ">{t('key_1783109431586_jpgz')}<" },
      { find: />فضي</, replace: ">{t('key_1783109431594_kafm')}<" },
      { find: />ذهبي</, replace: ">{t('key_1783109431603_fqhn')}<" },
      
      // Fix shadowing
      { find: /teachers\.filter\(\(t\) => {/g, replace: "teachers.filter((teacher) => {" },
      { find: /renderRow={\(t\) => {/g, replace: "renderRow={(teacher) => {" },
      { find: /t\.id/g, replace: "teacher.id" },
      { find: /t\.profileImageUrl/g, replace: "teacher.profileImageUrl" },
      { find: /t\.user/g, replace: "teacher.user" },
      { find: /t\.specialization/g, replace: "teacher.specialization" },
      { find: /t\.email/g, replace: "teacher.email" },
      { find: /t\.averageRating/g, replace: "teacher.averageRating" },
      { find: /t\.totalReviews/g, replace: "teacher.totalReviews" },
      { find: /t\.verificationLevel/g, replace: "teacher.verificationLevel" },
    ]
  },
  {
    path: 'app/[locale]/teachers/page.tsx',
    namespace: 'teachers',
    replacements: [
      { find: />لم نتمكن من العثور على معلمين</, replace: ">{t('key_1783109427736_99ff')}<" },
      { find: />جرب تعديل عوامل التصفية أو البحث بكلمات مختلفة.</, replace: ">{t('key_1783109427747_43fd')}<" },
      { find: />مسح التصفية</, replace: ">{t('key_1783109427760_qcyq')}<" },
      { find: /"غير محدد"/, replace: "t('ghyr_mhdd')" },
      { find: />الصفوف:</, replace: ">{t('key_1783109427774_cfcr')}<" },
      { find: />من </, replace: ">{t('mn')}<" },
      { find: />إعادة المحاولة</, replace: ">{t('key_1783109427722_yuwk')}<" },

      // Fix shadowing
      { find: /teachers\.map\(\(t\) => {/g, replace: "teachers.map((teacher) => {" },
      { find: /t\.id/g, replace: "teacher.id" },
      { find: /t\.slug/g, replace: "teacher.slug" },
      { find: /t\.profileImageUrl/g, replace: "teacher.profileImageUrl" },
      { find: /t\.user/g, replace: "teacher.user" },
      { find: /t\.verificationLevel/g, replace: "teacher.verificationLevel" },
      { find: /t\.subjects/g, replace: "teacher.subjects" },
      { find: /t\.subSpecialization/g, replace: "teacher.subSpecialization" },
      { find: /t\.city/g, replace: "teacher.city" },
      { find: /t\.area/g, replace: "teacher.area" },
      { find: /t\.gradeLevels/g, replace: "teacher.gradeLevels" },
      { find: /t\.averageRating/g, replace: "teacher.averageRating" },
      { find: /t\.totalReviews/g, replace: "teacher.totalReviews" },
      { find: /t\.services/g, replace: "teacher.services" }
    ]
  },
  {
    path: 'app/[locale]/teachers/[slug]/page.tsx',
    namespace: 'teachers',
    replacements: [
      { find: /1: "الأول",/, replace: "1: t('key_1783109427957_e53t') ," },
      { find: /2: "الثاني",/, replace: "2: t('key_1783109427963_de9z') ," },
      { find: /3: "الثالث",/, replace: "3: t('key_1783109427968_jq6s') ," },
      { find: /4: "الرابع",/, replace: "4: t('key_1783109427987_kasc') ," },
      { find: /5: "الخامس",/, replace: "5: t('key_1783109427993_569z') ," },
      { find: /6: "السادس",/, replace: "6: t('key_1783109427998_8ikp') ," },
      { find: /7: "السابع",/, replace: "7: t('key_1783109428004_vcdi') ," },
      { find: /8: "الثامن",/, replace: "8: t('key_1783109428009_ffra') ," },
      { find: /9: "التاسع",/, replace: "9: t('key_1783109428016_rsv5') ," },
      { find: /10: "العاشر",/, replace: "10: t('key_1783109428022_dg13') ," },
      { find: /11: "الحادي عشر",/, replace: "11: t('key_1783109428028_5si7') ," },
      { find: /12: "الثاني عشر",/, replace: "12: t('key_1783109428033_85m6') ," },
      { find: /BRONZE: "🥉 برونزي",/, replace: "BRONZE: t('key_1783109429415_wbip') ," },
      { find: /SILVER: "🥈 فضي",/, replace: "SILVER: t('key_1783109429422_1ndn') ," },
      { find: /GOLD: "🥇 ذهبي",/, replace: "GOLD: t('key_1783109429429_v3ds') ," },
      { find: /title: "معلم غير موجود"/, replace: "title: t('key_1783109429440_svyo')" },
      { find: /"غير محدد"/g, replace: "t('ghyr_mhdd')" },
      { find: /"غير معروف"/, replace: "t('key_1783109429460_z0kk')" },

      // Fix GRADE_LABELS and VERIFICATION_LABELS
      { find: /const GRADE_LABELS: Record<number, string> = {/g, replace: 'const getGradeLabels = (t: any): Record<number, string> => ({' },
      { find: /12: t\('key_1783109428033_85m6'\) ,\n};/g, replace: "12: t('key_1783109428033_85m6') ,\n});" },
      { find: /const VERIFICATION_LABELS: Record<string, string> = {/g, replace: 'const getVerificationLabels = (t: any): Record<string, string> => ({' },
      { find: /GOLD: t\('key_1783109429429_v3ds'\) ,\n};/g, replace: "GOLD: t('key_1783109429429_v3ds') ,\n});" },

      // Fix generateMetadata
      {
        find: /params: Promise<{ slug: string }>;\n}\): Promise<Metadata> {\n\tconst { slug } = await params;/g,
        replace: "params: Promise<{ slug: string; locale: string }>;\n}): Promise<Metadata> {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });"
      },

      // Fix TeacherProfilePage
      {
        find: /export default async function TeacherProfilePage\({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string }>;\n}\) {\n\tconst { slug } = await params;/g,
        replace: "export default async function TeacherProfilePage({\n\tparams,\n}: {\n\tparams: Promise<{ slug: string; locale: string }>;\n}) {\n\tconst { slug, locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });\n\tconst GRADE_LABELS = getGradeLabels(t);\n\tconst VERIFICATION_LABELS = getVerificationLabels(t);"
      }
    ]
  }
];

filesToRecover.forEach(fileDef => {
  if (fs.existsSync(fileDef.path)) {
    let content = fs.readFileSync(fileDef.path, 'utf8');
    
    // special handling for missing import
    if (fileDef.path.includes('teachers/[slug]/page.tsx')) {
      if (!content.includes('getTranslations')) {
        content = 'import { getTranslations } from "next-intl/server";\n' + content;
      }
    }

    fileDef.replacements.forEach(rep => {
      content = content.replace(rep.find, rep.replace);
    });
    fs.writeFileSync(fileDef.path, content, 'utf8');
    console.log('Fixed', fileDef.path);
  }
});
