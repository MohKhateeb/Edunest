const fs = require('fs');
const path = require('path');

const directoriesToScan = ['app', 'components'];

// RTL-First Migration Mappings
// Physical Right = Logical Start (ms-, ps-, text-start, start-, border-s-, rounded-s-, rounded-es, rounded-ss)
// Physical Left  = Logical End (me-, pe-, text-end, end-, border-e-, rounded-e-, rounded-ee, rounded-se)
const replacements = [
  // Margins
  { regex: /\bml-([\w\.\-\[\]]+)\b/g, replace: 'me-$1' },
  { regex: /\bmr-([\w\.\-\[\]]+)\b/g, replace: 'ms-$1' },
  { regex: /\b-ml-([\w\.\-\[\]]+)\b/g, replace: '-me-$1' },
  { regex: /\b-mr-([\w\.\-\[\]]+)\b/g, replace: '-ms-$1' },
  // Padding
  { regex: /\bpl-([\w\.\-\[\]]+)\b/g, replace: 'pe-$1' },
  { regex: /\bpr-([\w\.\-\[\]]+)\b/g, replace: 'ps-$1' },
  // Text Alignment
  { regex: /\btext-left\b/g, replace: 'text-end' },
  { regex: /\btext-right\b/g, replace: 'text-start' },
  // Positioning
  { regex: /\bleft-([\w\.\-\[\]]+)\b/g, replace: 'end-$1' },
  { regex: /\bright-([\w\.\-\[\]]+)\b/g, replace: 'start-$1' },
  { regex: /\b-left-([\w\.\-\[\]]+)\b/g, replace: '-end-$1' },
  { regex: /\b-right-([\w\.\-\[\]]+)\b/g, replace: '-start-$1' },
  // Borders
  { regex: /\bborder-l\b/g, replace: 'border-e' },
  { regex: /\bborder-r\b/g, replace: 'border-s' },
  { regex: /\bborder-l-([\w\.\-\[\]]+)\b/g, replace: 'border-e-$1' },
  { regex: /\bborder-r-([\w\.\-\[\]]+)\b/g, replace: 'border-s-$1' },
  // Border Radius (Corners)
  { regex: /\brounded-l-([\w\.\-\[\]]+)\b/g, replace: 'rounded-e-$1' },
  { regex: /\brounded-r-([\w\.\-\[\]]+)\b/g, replace: 'rounded-s-$1' },
  { regex: /\brounded-l\b/g, replace: 'rounded-e' },
  { regex: /\brounded-r\b/g, replace: 'rounded-s' },
  { regex: /\brounded-bl-([\w\.\-\[\]]+)\b/g, replace: 'rounded-ee-$1' },
  { regex: /\brounded-br-([\w\.\-\[\]]+)\b/g, replace: 'rounded-es-$1' },
  { regex: /\brounded-tl-([\w\.\-\[\]]+)\b/g, replace: 'rounded-se-$1' },
  { regex: /\brounded-tr-([\w\.\-\[\]]+)\b/g, replace: 'rounded-ss-$1' },
  { regex: /\brounded-bl\b/g, replace: 'rounded-ee' },
  { regex: /\brounded-br\b/g, replace: 'rounded-es' },
  { regex: /\brounded-tl\b/g, replace: 'rounded-se' },
  { regex: /\brounded-tr\b/g, replace: 'rounded-ss' },
];

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
let totalReplacements = 0;

directoriesToScan.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = scanDir(dir);
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    replacements.forEach(({ regex, replace }) => {
      const matches = content.match(regex);
      if (matches) {
        totalReplacements += matches.length;
        content = content.replace(regex, replace);
      }
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedFiles++;
      console.log(`Updated: ${file}`);
    }
  });
});

console.log(`\nSuccessfully applied RTL-first logical classes to ${modifiedFiles} files (${totalReplacements} replacements).`);
