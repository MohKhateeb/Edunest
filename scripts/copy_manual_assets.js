const fs = require('fs');
const path = require('path');

const srcDir = `C:\\Users\\khatibmoh\\.gemini\\antigravity\\brain\\8848cf89-e1e5-4d06-b0da-c3209d5d4aa2`;
const destDir = path.join(__dirname, '..', 'public', 'docs', 'images');

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Find files in srcDir matching our mockups
const files = fs.readdirSync(srcDir);
files.forEach(file => {
  if (file.startsWith('parent_dashboard_mockup') && file.endsWith('.png')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, 'parent_dashboard.png'));
    console.log('Copied parent dashboard image');
  } else if (file.startsWith('teacher_dashboard_mockup') && file.endsWith('.png')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, 'teacher_dashboard.png'));
    console.log('Copied teacher dashboard image');
  } else if (file.startsWith('admin_dashboard_mockup') && file.endsWith('.png')) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, 'admin_dashboard.png'));
    console.log('Copied admin dashboard image');
  }
});
