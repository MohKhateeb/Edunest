const fs = require('fs');

let content = fs.readFileSync('lib/services/domain/financial-service.ts', 'utf8');

if (!content.includes('getErrorT')) {
    content = 'import { getErrorT, getTranslations } from "@/lib/i18n/get-server-translations";\n' + content;
}

content = content.replace(/"حدث خطأ، لا يوجد ملف معلم\."/g, 'await (async () => { const t = await getErrorT(); return t("financial_teacher_profile_missing"); })()');
content = content.replace(/"غير معروف"/g, 'await (async () => { const t = await getTranslations("common"); return t("unknown"); })()');

fs.writeFileSync('lib/services/domain/financial-service.ts', content, 'utf8');
console.log('financial-service updated');
