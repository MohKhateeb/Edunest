const http = require('http');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function check() {
  try {
    const arHtml = await fetchPage('http://localhost:3000/ar/terms');
    const arTitle = arHtml.match(/<title>(.*?)<\/title>/)?.[1];
    const arDesc = arHtml.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i)?.[1];
    
    console.log('--- AR ---');
    console.log('Title:', arTitle);
    console.log('Description:', arDesc);

    const enHtml = await fetchPage('http://localhost:3000/en/terms');
    const enTitle = enHtml.match(/<title>(.*?)<\/title>/)?.[1];
    const enDesc = enHtml.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i)?.[1];
    
    console.log('--- EN ---');
    console.log('Title:', enTitle);
    console.log('Description:', enDesc);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
