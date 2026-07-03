const fs = require('fs');
['app/[locale]/dashboard/teacher/bookings/[id]/page.tsx', 'app/[locale]/teachers/[slug]/page.tsx'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\\'teachers\\'/g, "'teachers'");
  c = c.replace(/\\'common\\'/g, "'common'");
  fs.writeFileSync(f, c);
});
