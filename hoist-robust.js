const fs = require('fs');
const { Project, SyntaxKind } = require('ts-morph');

const files = [
  'lib/services/booking-service.ts', 'lib/services/domain/financial-service.ts', 'lib/actions/teacher.ts',
  'lib/actions/admin/service-types.ts', 'lib/actions/details.ts', 'lib/actions/admin.ts', 'lib/actions/review.ts',
  'lib/actions/notification.ts', 'lib/actions/tutoring-requests/instant-book.ts', 'lib/actions/tutoring-requests/create.ts',
  'lib/actions/tutoring-requests/status.ts', 'lib/actions/availability.ts', 'lib/actions/disputes.ts', 'lib/actions/faq.ts',
  'lib/actions/bookings/search.ts', 'lib/actions/bookings/accept.ts', 'lib/actions/bookings/report.ts',
  'lib/actions/bookings/pay.ts', 'lib/actions/payout.ts', 'lib/utils/availability.ts', 'lib/utils/slug.ts',
  'lib/repositories/disputeRepository.ts'
];

// Phase 1: Regex replace IIFEs
const regex = /await\s*\(\s*async\s*\(\)\s*=>\s*\{\s*const\s+t\s*=\s*await\s*(getErrorT|getNotificationT)\(\);\s*return\s*t\(([\s\S]*?)\);\s*\}\)\(\)/g;

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  if (regex.test(content)) {
    content = content.replace(regex, (match, func, args) => {
      return (func === 'getErrorT' ? 'tError' : 'tNotif') + '(' + args + ')';
    });
    fs.writeFileSync(f, content, 'utf8');
  }
});

// Phase 2: ts-morph inject declarations
const project = new Project();
files.forEach(f => {
  if (fs.existsSync(f)) project.addSourceFileAtPath(f);
});

project.getSourceFiles().forEach(sourceFile => {
  let changed = false;
  
  // Find all CallExpressions of `tError` or `tNotif`
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  const functionHoists = new Map();

  calls.forEach(call => {
    const expr = call.getExpression();
    if (expr.getKind() === SyntaxKind.Identifier) {
      const name = expr.getText();
      if (name === 'tError' || name === 'tNotif') {
        // find containing function
        const containingFunc = call.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) ||
                               call.getFirstAncestorByKind(SyntaxKind.ArrowFunction) ||
                               call.getFirstAncestorByKind(SyntaxKind.MethodDeclaration);
        
        if (containingFunc) {
          if (!functionHoists.has(containingFunc)) {
            functionHoists.set(containingFunc, { err: false, notif: false });
          }
          const flags = functionHoists.get(containingFunc);
          if (name === 'tError') flags.err = true;
          if (name === 'tNotif') flags.notif = true;
        }
      }
    }
  });

  if (functionHoists.size > 0) {
    for (const [func, flags] of functionHoists.entries()) {
      // Because we used tError and tNotif everywhere, the user's requested `t` for single calls can be implemented now!
      // If only one is needed, we can rename it back to `t` in the AST!
      const both = flags.err && flags.notif;
      let stmts = [];
      
      if (both) {
        if (flags.err) stmts.push('const tError = await getErrorT();');
        if (flags.notif) stmts.push('const tNotif = await getNotificationT();');
      } else {
        if (flags.err) {
          stmts.push('const t = await getErrorT();');
          // rename tError to t in this function block
          func.getDescendantsOfKind(SyntaxKind.Identifier).forEach(id => {
            if (id.getText() === 'tError') id.replaceWithText('t');
          });
        }
        if (flags.notif) {
          stmts.push('const t = await getNotificationT();');
          // rename tNotif to t in this function block
          func.getDescendantsOfKind(SyntaxKind.Identifier).forEach(id => {
            if (id.getText() === 'tNotif') id.replaceWithText('t');
          });
        }
      }
      
      const body = func.getBody();
      if (body && body.getKind() === SyntaxKind.Block) {
        body.insertStatements(0, stmts.join('\n'));
        changed = true;
      }
    }
  }

  if (changed) {
    sourceFile.saveSync();
    console.log(`Injected in ${sourceFile.getFilePath()}`);
  }
});
