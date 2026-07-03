const fs = require('fs');
const path = require('path');

const directoriesToScan = ['app', 'components'];
const regex = /\s*dir="rtl"/g;
const regex2 = /\s*dir=\{'rtl'\}/g;

function scanDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanDir(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

let modifiedFiles = 0;

directoriesToScan.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = scanDir(dir);
  
  files.forEach(file => {
    // skip layout.tsx if it contains dynamic dir
    if (file.includes('layout.tsx')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    content = content.replace(regex, '');
    content = content.replace(regex2, '');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedFiles++;
    }
  });
});

console.log(`Removed hardcoded dir="rtl" from ${modifiedFiles} files.`);
