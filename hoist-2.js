const fs = require('fs');
const { Project, SyntaxKind } = require('ts-morph');

const files = [
  'lib/services/booking-cleanup.ts', 
  'lib/actions/bookings/reject.ts'
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
  
  const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  const functionHoists = new Map();

  calls.forEach(call => {
    const expr = call.getExpression();
    if (expr.getKind() === SyntaxKind.Identifier) {
      const name = expr.getText();
      if (name === 'tError' || name === 'tNotif') {
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
      const both = flags.err && flags.notif;
      let stmts = [];
      
      if (both) {
        if (flags.err) stmts.push('const tError = await getErrorT();');
        if (flags.notif) stmts.push('const tNotif = await getNotificationT();');
      } else {
        if (flags.err) {
          stmts.push('const t = await getErrorT();');
          func.getDescendantsOfKind(SyntaxKind.Identifier).forEach(id => {
            if (id.getText() === 'tError') id.replaceWithText('t');
          });
        }
        if (flags.notif) {
          // Check if 't' is already declared in this scope (from getTranslations maybe)
          let tExists = false;
          func.getVariableDeclarations().forEach(v => {
            if (v.getName() === 't') tExists = true;
          });

          if (tExists) {
            stmts.push('const tNotif = await getNotificationT();');
          } else {
            stmts.push('const t = await getNotificationT();');
            func.getDescendantsOfKind(SyntaxKind.Identifier).forEach(id => {
              if (id.getText() === 'tNotif') id.replaceWithText('t');
            });
          }
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
