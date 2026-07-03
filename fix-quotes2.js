const fs = require('fs');
let f = 'app/[locale]/dashboard/parent/financials/page.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/\\'parent\\'/g, "'parent'");
fs.writeFileSync(f, c);
