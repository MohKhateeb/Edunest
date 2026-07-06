const fs = require('fs');

let content = fs.readFileSync('lib/utils/slug.ts', 'utf8');

if (!content.includes('getErrorT')) {
    content = 'import { getErrorT } from "@/lib/i18n/get-server-translations";\n' + content;
}

content = content.replace(/"فشل توليد slug فريد بعد عدة محاولات"/g, 'await (async () => { const t = await getErrorT(); return t("slug_generation_failed"); })()');

fs.writeFileSync('lib/utils/slug.ts', content, 'utf8');
console.log('slug.ts updated');
