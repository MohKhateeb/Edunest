const fs = require('fs');

function fixSyntax(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/};\s*/g, (match, offset) => {
    // only replace the first two in teachers/slug/page.tsx
    if (path.includes('slug') && offset < 1000) {
      return '});\n\n';
    }
    return match;
  });
  
  if (path.includes('Sidebar.tsx')) {
    content = content.replace(/};\s*export default function Sidebar/, '});\n\nexport default function Sidebar');
  }
  
  fs.writeFileSync(path, content, 'utf8');
}

fixSyntax('app/[locale]/teachers/[slug]/page.tsx');
fixSyntax('components/shared/Sidebar.tsx');
console.log("Fixed with regex");
