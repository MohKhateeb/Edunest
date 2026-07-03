const fs = require('fs');
const https = require('https');

const messages = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));
const fileData = messages;

async function translateText(text) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed[0].map(x => x[0]).join(''));
        } catch (e) {
          resolve(text);
        }
      });
    }).on('error', (e) => resolve(text));
  });
}

// Custom EduNest terminology override
const termOverrides = {
  "حجز": "Booking",
  "معلم": "Teacher",
  "طالب": "Student",
  "ولي الأمر": "Parent",
  "جلسة": "Session",
  "إيرادات": "Earnings",
  "انتظار الموافقة": "Pending approval",
  "مؤكد": "Confirmed",
  "ملغي": "Cancelled",
  "حفظ التغييرات": "Save changes",
  "تسجيل الدخول": "Sign in"
};

async function processTranslations() {
  let count = 0;
  for (const ns of Object.keys(fileData)) {
    for (const key of Object.keys(fileData[ns])) {
      const val = fileData[ns][key];
      if (typeof val === 'string' && val.startsWith('[TRANSLATE]: ')) {
        const ar = val.replace('[TRANSLATE]: ', '').trim();
        
        let en = termOverrides[ar];
        if (!en) {
          // Check partial overrides
          let translated = await translateText(ar);
          if (translated) {
            en = translated.trim();
            // Capitalize first letter, lowercase rest if it's a short phrase
            if (en.length < 30 && !en.includes('.')) {
              en = en.charAt(0).toUpperCase() + en.slice(1).toLowerCase();
            }
          }
        }
        
        if (en) {
          fileData[ns][key] = en;
          count++;
          if (count % 50 === 0) console.log(`Translated ${count} strings...`);
          // Sleep slightly to avoid rate limiting
          await new Promise(r => setTimeout(r, 100));
        }
      }
    }
  }
  
  fs.writeFileSync('messages/en.json', JSON.stringify(fileData, null, 2));
  console.log(`Successfully translated ${count} strings!`);
}

processTranslations();
