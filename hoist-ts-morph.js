const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
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
    project.addSourceFileAtPath(f);
  }
});

let modifiedFiles = 0;

project.getSourceFiles().forEach(sourceFile => {
  let fileChanged = false;
  
  // Find all AwaitExpressions
  const awaitExprs = sourceFile.getDescendantsOfKind(SyntaxKind.AwaitExpression);
  
  const functionHoists = new Map(); // functionNode -> { needsError: boolean, needsNotif: boolean }

  awaitExprs.forEach(awaitExpr => {
    const expr = awaitExpr.getExpression();
    if (expr.getKind() === SyntaxKind.CallExpression) {
      const callExpr = expr;
      const caller = callExpr.getExpression();
      if (caller.getKind() === SyntaxKind.ParenthesizedExpression) {
        const arrowFunc = caller.getExpression();
        if (arrowFunc.getKind() === SyntaxKind.ArrowFunction) {
          const bodyText = arrowFunc.getBodyText();
          if (bodyText && bodyText.includes('const t = await getErrorT();') || bodyText.includes('const t = await getNotificationT();')) {
            const isError = bodyText.includes('getErrorT()');
            const isNotif = bodyText.includes('getNotificationT()');
            
            // Extract what's inside return t(...)
            const match = bodyText.match(/return\s+t\(([\s\S]*?)\);/);
            if (match) {
              const args = match[1];
              const prefix = isError ? 'tError' : 'tNotif';
              
              // Find containing function
              const containingFunc = awaitExpr.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) ||
                                     awaitExpr.getFirstAncestorByKind(SyntaxKind.ArrowFunction) ||
                                     awaitExpr.getFirstAncestorByKind(SyntaxKind.MethodDeclaration);
              
              if (containingFunc) {
                if (!functionHoists.has(containingFunc)) {
                  functionHoists.set(containingFunc, { needsError: false, needsNotif: false });
                }
                const flags = functionHoists.get(containingFunc);
                if (isError) flags.needsError = true;
                if (isNotif) flags.needsNotif = true;
                
                awaitExpr.replaceWithText(`${prefix}(${args})`);
                fileChanged = true;
              }
            }
          }
        }
      }
    }
  });

  if (fileChanged) {
    // Insert statements at the top of functions
    for (const [func, flags] of functionHoists.entries()) {
      let stmts = [];
      if (flags.needsError) stmts.push('const tError = await getErrorT();');
      if (flags.needsNotif) stmts.push('const tNotif = await getNotificationT();');
      
      const body = func.getBody();
      if (body && body.getKind() === SyntaxKind.Block) {
        body.insertStatements(0, stmts.join('\n'));
      }
    }
    sourceFile.saveSync();
    modifiedFiles++;
    console.log(`Processed ${sourceFile.getFilePath()}`);
  }
});

console.log(`Modified ${modifiedFiles} files.`);
