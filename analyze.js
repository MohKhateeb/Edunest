const fs = require('fs');
const messages = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const counts = {};
Object.values(messages).forEach(ns => Object.values(ns).forEach(val => {
  if (typeof val === 'string' && val.startsWith('[TRANSLATE]: ')) {
    const ar = val.replace('[TRANSLATE]: ', '').trim();
    counts[ar] = (counts[ar] || 0) + 1;
  }
}));
const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 50);
console.log('Top 50 translations:');
sorted.forEach(([k, v]) => console.log(v + 'x: ' + k));
console.log('Total unique strings:', Object.keys(counts).length);
