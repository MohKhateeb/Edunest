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
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;

    // Pattern to match functions. This is complex in TS.
    // We will do a simpler approach:
    // 1. Find all `await (async () => { const t = await getErrorT(); return t("KEY" ...) })()`
    // 2. We can't easily parse functions. But wait, `tsc` will complain if `t` or `tNotif` isn't defined.
    // Instead of regex replacing function bodies, we can replace the IIFE with `t("KEY" ...)`
    // And to define `t`, we can inject `const t = await getErrorT();` after `export async function ... {` 
    // or inside the main exported function of the action!
    // Almost all files are Server Actions where the main block is `export async function myAction(...) {`
    // Wait, in some files there are multiple functions!
    
    // Let's use regex to find: `export async function [Name](...) {`
    // and inject `const t = await getErrorT();` if it contains `getErrorT` inside.
    
    // Instead, I can use a simpler regex that matches the IIFE and replaces it with `await getErrorT().then(t => t("KEY"))` ?
    // No, the user explicitly asked: "أضف سطراً واحداً بالقرب من بداية الدالة: const t = await getErrorT(); ... واستبدل كل ... بـ t("KEY") مباشرة".
    
    // So we must inject at the top of functions.
    // Let's use an AST-based script using Babel? We don't have babel installed maybe, but we can write a quick regex logic.
    // We can split by `function ` or `const name = async (` and inject.
    // Actually, I can write a regex that matches `async function X(args) {` and adds `const t = await getErrorT();`
  }
});
