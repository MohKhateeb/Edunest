const fs = require('fs');

const path = 'app/[locale]/teachers/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /export default async function TeachersPage\(\{[\s\S]*?searchParams,[\s\S]*?\}\: \{[\s\S]*?searchParams\: Promise<SearchParams>;[\s\S]*?\}\) \{[\s\S]*?const params = await searchParams;/m,
  "export default async function TeachersPage({\n\tsearchParams,\n\tparams,\n}: {\n\tsearchParams: Promise<SearchParams>;\n\tparams: Promise<{ locale: string }>;\n}) {\n\tconst resolvedSearchParams = await searchParams;\n\tconst { locale } = await params;\n\tconst t = await getTranslations({ locale, namespace: 'teachers' });"
);

content = content.replace(/params\.subject/g, "resolvedSearchParams.subject");
content = content.replace(/params\.city/g, "resolvedSearchParams.city");

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed teachers page regex");
