const fs = require('fs');

const path = 'app/[locale]/teachers/[slug]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/};\r?\n\r?\nconst getVerificationLabels/, '});\n\nconst getVerificationLabels');
content = content.replace(/};\r?\n\r?\nasync function getTeacher/, '});\n\nasync function getTeacher');

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed page.tsx");
