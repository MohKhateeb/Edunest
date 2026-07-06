const fs = require('fs');

function updateJson(filePath, newCommon) {
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  data.common = { ...data.common, ...newCommon };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

updateJson('messages/ar.json', { unspecified: "غير محدد", grade_level: "الصف {grade}" });
updateJson('messages/en.json', { unspecified: "Unspecified", grade_level: "Grade {grade}" });

console.log('Added common keys');
