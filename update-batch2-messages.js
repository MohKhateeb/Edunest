const fs = require('fs');

const extracted = JSON.parse(fs.readFileSync('batch2_extracted_ar.json', 'utf8'));

// read ar.json
let arContent = fs.readFileSync('messages/ar.json', 'utf8');
let arData = JSON.parse(arContent);

// read en.json
let enContent = fs.readFileSync('messages/en.json', 'utf8');
let enData = JSON.parse(enContent);

for (const [key, arString] of Object.entries(extracted)) {
  arData.errors[key] = arString;
  enData.errors[key] = "[EN] " + arString; // using arabic as placeholder for english
}

fs.writeFileSync('messages/ar.json', JSON.stringify(arData, null, 2), 'utf8');
fs.writeFileSync('messages/en.json', JSON.stringify(enData, null, 2), 'utf8');

console.log('Appended to messages');
