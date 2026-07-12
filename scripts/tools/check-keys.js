const fs = require('fs');
const path = require('path');
const arJson = JSON.parse(fs.readFileSync('messages/ar.json', 'utf8'));

// recursively find all .tsx and .ts files
function walk(dir, fileList = []) {
  if (dir.includes('node_modules') || dir.includes('.next') || dir.includes('.git')) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileList);
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const allFiles = walk('.');
let missing = [];

const regexList = [
  /\bt\\(['"]([^'"]+)['"]\)/g,
  /tCommon\(['"]([^'"]+)['"]\)/g,
  /tAdvisors\(['"]([^'"]+)['"]\)/g,
  /tNav\(['"]([^'"]+)['"]\)/g,
];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const regex of regexList) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const key = match[1];
      // check if key exists anywhere in ar.json
      let found = false;
      for (const ns of Object.keys(arJson)) {
        if (arJson[ns][key]) {
          found = true;
          break;
        }
      }
      if (!found && key !== 'legal_terms_page_title') {
        missing.push({ file, key, match: match[0] });
      }
    }
  }
}

if (missing.length === 0) {
  console.log("No missing keys found!");
} else {
  console.log('Missing keys:');
  for (const m of missing) {
    console.log(`- File: ${m.file}, Key: ${m.key}, Match: ${m.match}`);
  }
}
