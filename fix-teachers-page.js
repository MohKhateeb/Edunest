const fs = require('fs');

function runRecover() {
  const filesToRecover = [
    {
      path: 'app/[locale]/teachers/page.tsx',
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
    }
  ];

  filesToRecover.forEach(fileDef => {
    if (fs.existsSync(fileDef.path)) {
      let content = fs.readFileSync(fileDef.path, 'utf8');
      
      fileDef.replacements.forEach(rep => {
        content = content.replace(rep.find, rep.replace);
      });
      fs.writeFileSync(fileDef.path, content, 'utf8');
    }
  });
}

function fixMissing() {
  let teachersPagePath = 'app/[locale]/teachers/page.tsx';
  let teachersContent = fs.readFileSync(teachersPagePath, 'utf8');
  if (!teachersContent.includes("const t = await getTranslations")) {
    teachersContent = teachersContent.replace(
      /export default async function TeachersPage\({\n\tsearchParams,\n}: {\n\tsearchParams: Promise<SearchParams>;\n}\) {/,
      "export default async function TeachersPage({\n\tsearchParams,\n\tparams\n}: {\n\tsearchParams: Promise<SearchParams>;\n\tparams: Promise<{ locale: string }>;\n}) {\n\tconst { locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });"
    );
    if (!teachersContent.includes('import { getTranslations }')) {
      teachersContent = 'import { getTranslations } from "next-intl/server";\n' + teachersContent;
    }
    fs.writeFileSync(teachersPagePath, teachersContent, 'utf8');
  }
}

runRecover();
fixMissing();
console.log("Fixed teachers page");
