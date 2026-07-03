const fs = require('fs');
const path = require('path');

const directoriesToScan = ['app', 'components'];

const replacements = [
  // Margins
  { regex: /\\bml-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'ms-$1' },
  { regex: /\\bmr-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'me-$1' },
  // Paddings
  { regex: /\\bpl-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'ps-$1' },
  { regex: /\\bpr-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'pe-$1' },
  // Text Alignment
  { regex: /\\btext-left\\b/g, replace: 'text-start' },
  { regex: /\\btext-right\\b/g, replace: 'text-end' },
  // Positioning (Absolute/Fixed)
  { regex: /\\bleft-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'start-$1' },
  { regex: /\\bright-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'end-$1' },
  // Borders
  { regex: /\\bborder-l-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'border-s-$1' },
  { regex: /\\bborder-r-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'border-e-$1' },
  { regex: /\\bborder-l\\b/g, replace: 'border-s' },
  { regex: /\\bborder-r\\b/g, replace: 'border-e' },
  // Rounded corners
  { regex: /\\brounded-l-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'rounded-s-$1' },
  { regex: /\\brounded-r-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'rounded-e-$1' },
  { regex: /\\brounded-l\\b/g, replace: 'rounded-s' },
  { regex: /\\brounded-r\\b/g, replace: 'rounded-e' },
  { regex: /\\brounded-tl-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'rounded-ss-$1' },
  { regex: /\\brounded-tr-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'rounded-se-$1' },
  { regex: /\\brounded-bl-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'rounded-es-$1' },
  { regex: /\\brounded-br-([\\d\\w\\.\\[\\]-]+)\\b/g, replace: 'rounded-ee-$1' },
  { regex: /\\brounded-tl\\b/g, replace: 'rounded-ss' },
  { regex: /\\brounded-tr\\b/g, replace: 'rounded-se' },
  { regex: /\\brounded-bl\\b/g, replace: 'rounded-es' },
  { regex: /\\brounded-br\\b/g, replace: 'rounded-ee' },
].map(r => ({ regex: new RegExp(r.regex.source, 'g'), replace: r.replace })); // No need, wait, I will construct RegExp from strings!

// Actually let's use strings
const replacementsStrings = [
  { regex: "\\bml-([\\d\\w\\.\\[\\]-]+)\\b", replace: "ms-$1" },
  { regex: "\\bmr-([\\d\\w\\.\\[\\]-]+)\\b", replace: "me-$1" },
  { regex: "\\bpl-([\\d\\w\\.\\[\\]-]+)\\b", replace: "ps-$1" },
  { regex: "\\bpr-([\\d\\w\\.\\[\\]-]+)\\b", replace: "pe-$1" },
  { regex: "\\btext-left\\b", replace: "text-start" },
  { regex: "\\btext-right\\b", replace: "text-end" },
  { regex: "\\bleft-([\\d\\w\\.\\[\\]-]+)\\b", replace: "start-$1" },
  { regex: "\\bright-([\\d\\w\\.\\[\\]-]+)\\b", replace: "end-$1" },
  { regex: "\\bborder-l-([\\d\\w\\.\\[\\]-]+)\\b", replace: "border-s-$1" },
  { regex: "\\bborder-r-([\\d\\w\\.\\[\\]-]+)\\b", replace: "border-e-$1" },
  { regex: "\\bborder-l\\b", replace: "border-s" },
  { regex: "\\bborder-r\\b", replace: "border-e" },
  { regex: "\\brounded-l-([\\d\\w\\.\\[\\]-]+)\\b", replace: "rounded-s-$1" },
  { regex: "\\brounded-r-([\\d\\w\\.\\[\\]-]+)\\b", replace: "rounded-e-$1" },
  { regex: "\\brounded-l\\b", replace: "rounded-s" },
  { regex: "\\brounded-r\\b", replace: "rounded-e" },
  { regex: "\\brounded-tl-([\\d\\w\\.\\[\\]-]+)\\b", replace: "rounded-ss-$1" },
  { regex: "\\brounded-tr-([\\d\\w\\.\\[\\]-]+)\\b", replace: "rounded-se-$1" },
  { regex: "\\brounded-bl-([\\d\\w\\.\\[\\]-]+)\\b", replace: "rounded-es-$1" },
  { regex: "\\brounded-br-([\\d\\w\\.\\[\\]-]+)\\b", replace: "rounded-ee-$1" },
  { regex: "\\brounded-tl\\b", replace: "rounded-ss" },
  { regex: "\\brounded-tr\\b", replace: "rounded-se" },
  { regex: "\\brounded-bl\\b", replace: "rounded-es" },
  { regex: "\\brounded-br\\b", replace: "rounded-ee" },
];

const compiledReplacements = replacementsStrings.map(r => ({
  regex: new RegExp(r.regex, 'g'),
  replace: r.replace
}));

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
    
    compiledReplacements.forEach(({ regex, replace }) => {
      content = content.replace(regex, replace);
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedFiles++;
    }
  });
});

console.log(`Migrated logical classes in ${modifiedFiles} files.`);
