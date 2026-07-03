const fs = require('fs');
let f = 'app/[locale]/dashboard/parent/financials/page.tsx';
let c = fs.readFileSync(f, 'utf8');
if (!c.includes('next-intl/server')) {
  c = "import { getTranslations } from 'next-intl/server';\n" + c;
  fs.writeFileSync(f, c);
}
