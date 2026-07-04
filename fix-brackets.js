const fs = require('fs');

function fixBrackets(path, fromStr, toStr) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(fromStr, toStr);
  fs.writeFileSync(path, content, 'utf8');
}

fixBrackets('app/[locale]/teachers/[slug]/page.tsx', 
    "\t12: t('key_1783109428033_85m6') ,\n};", 
    "\t12: t('key_1783109428033_85m6') ,\n});");

fixBrackets('app/[locale]/teachers/[slug]/page.tsx', 
    "\tGOLD: t('key_1783109429429_v3ds') ,\n};", 
    "\tGOLD: t('key_1783109429429_v3ds') ,\n});");

fixBrackets('components/shared/Sidebar.tsx', 
    "\t],\n};\n\nexport default function Sidebar", 
    "\t],\n});\n\nexport default function Sidebar");

console.log("Fixed brackets");
