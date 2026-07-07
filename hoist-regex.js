const fs = require('fs');

const files = [
  'lib/services/booking-service.ts', 'lib/services/domain/financial-service.ts', 'lib/actions/teacher.ts',
  'lib/actions/admin/service-types.ts', 'lib/actions/details.ts', 'lib/actions/admin.ts', 'lib/actions/review.ts',
  'lib/actions/notification.ts', 'lib/actions/tutoring-requests/instant-book.ts', 'lib/actions/tutoring-requests/create.ts',
  'lib/actions/tutoring-requests/status.ts', 'lib/actions/availability.ts', 'lib/actions/disputes.ts', 'lib/actions/faq.ts',
  'lib/actions/bookings/search.ts', 'lib/actions/bookings/accept.ts', 'lib/actions/bookings/report.ts',
  'lib/actions/bookings/pay.ts', 'lib/actions/payout.ts', 'lib/utils/availability.ts', 'lib/utils/slug.ts',
  'lib/repositories/disputeRepository.ts'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');

  const regex = /await\s*\(\s*async\s*\(\)\s*=>\s*\{\s*const\s+t\s*=\s*await\s*(getErrorT|getNotificationT)\(\);\s*return\s*t\(([\s\S]*?)\);\s*\}\)\(\)/g;
  if (!regex.test(content)) return;

  const lines = content.split('\n');

  // We will scan lines to build function scopes
  // A function scope starts at `async function` or `async (` and ends when we find its closing brace.
  // Actually, simpler: we find all IIFEs. For each IIFE, find the closest `async` above it.
  // That identifies the "function block" line index.
  
  const functionBlocks = new Map(); // startIndex -> { hasError: boolean, hasNotif: boolean, iifeLines: Set }

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/await\s*\(\s*async\s*\(\)\s*=>\s*\{\s*const\s+t\s*=\s*await\s*(getErrorT|getNotificationT)\(\);\s*return\s*t\(/)) {
      // found an IIFE
      let j = i;
      let startIdx = -1;
      while (j >= 0) {
        if (lines[j].match(/async\s+function\s+\w+\s*\(/) || lines[j].match(/async\s*\([^)]*\)\s*=>/) || lines[j].match(/const\s+\w+\s*=\s*async\s*\([^)]*\)\s*=>/)) {
          startIdx = j;
          break;
        }
        j--;
      }
      
      if (startIdx !== -1) {
        // find `{`
        let k = startIdx;
        while (k <= i) {
          if (lines[k].includes('{')) {
            startIdx = k;
            break;
          }
          k++;
        }

        if (!functionBlocks.has(startIdx)) {
          functionBlocks.set(startIdx, { hasError: false, hasNotif: false, iifeLines: new Set() });
        }
        const block = functionBlocks.get(startIdx);
        block.iifeLines.add(i);
        if (lines[i].includes('getErrorT')) block.hasError = true;
        if (lines[i].includes('getNotificationT')) block.hasNotif = true;
      }
    }
  }

  // Now process each block
  const sortedStarts = Array.from(functionBlocks.keys()).sort((a,b) => b - a);
  for (const start of sortedStarts) {
    const block = functionBlocks.get(start);
    const both = block.hasError && block.hasNotif;
    const errName = both ? 'tError' : 't';
    const notifName = both ? 'tNotif' : 't';

    // 1. Inject vars at start
    let stmts = [];
    if (block.hasError) stmts.push(`\t\tconst ${errName} = await getErrorT();`);
    if (block.hasNotif) stmts.push(`\t\tconst ${notifName} = await getNotificationT();`);

    const parts = lines[start].split('{');
    lines[start] = parts[0] + '{\n' + stmts.join('\n') + parts.slice(1).join('{');

    // 2. Replace IIFEs in its lines
    for (const lineIdx of block.iifeLines) {
      lines[lineIdx] = lines[lineIdx].replace(regex, (match, func, args) => {
        const name = func === 'getErrorT' ? errName : notifName;
        return `${name}(${args})`;
      });
    }
  }

  fs.writeFileSync(f, lines.join('\n'), 'utf8');
  console.log(`Processed ${f}`);
});
