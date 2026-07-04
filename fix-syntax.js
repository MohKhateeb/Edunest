const fs = require('fs');

function fix(path, find, replace) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(find, replace);
  fs.writeFileSync(path, content, 'utf8');
}

fix('app/[locale]/teachers/[slug]/page.tsx', 
    "12: t('key_1783109428033_85m6') ,\n};", 
    "12: t('key_1783109428033_85m6') ,\n});");

fix('app/[locale]/teachers/[slug]/page.tsx', 
    "GOLD: t('key_1783109429429_v3ds') ,\n};", 
    "GOLD: t('key_1783109429429_v3ds') ,\n});");

fix('components/shared/Sidebar.tsx', 
    "\t],\n};", 
    "\t],\n});");

console.log("Fixed");
