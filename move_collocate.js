const fs = require('fs');
const path = require('path');

const moves = {
  "AdminBookingsList": "app/dashboard/admin/_components",
  "AdminTeachersList": "app/dashboard/admin/_components",
  "AdminUsersList": "app/dashboard/admin/_components",
  "AdminVerificationQueue": "app/dashboard/admin/_components",
  "AdminSettingsForm": "app/dashboard/admin/_components",
  "AdminServiceTypesManager": "app/dashboard/admin/_components",
  "AdminPayoutsEngine": "app/dashboard/admin/payouts/_components",
  "TeacherBookingsList": "app/dashboard/teacher/_components",
  "TeacherProfileForm": "app/dashboard/teacher/_components",
  "TeacherServicesForm": "app/dashboard/teacher/_components",
  "TeacherVerificationForm": "app/dashboard/teacher/_components",
  "TeacherSlugForm": "app/dashboard/teacher/_components",
  "ParentBookingsList": "app/dashboard/parent/_components",
  "ParentStudentsList": "app/dashboard/parent/_components",
  "AddStudentForm": "app/dashboard/parent/_components"
};

const rootDir = process.cwd();

// 1. Create target directories and move files
for (const [filename, targetDir] of Object.entries(moves)) {
  const sourcePath = path.join(rootDir, 'components', 'shared', `${filename}.tsx`);
  const targetDirPath = path.join(rootDir, targetDir);
  const targetPath = path.join(targetDirPath, `${filename}.tsx`);

  if (fs.existsSync(sourcePath)) {
    if (!fs.existsSync(targetDirPath)) {
      fs.mkdirSync(targetDirPath, { recursive: true });
    }
    fs.renameSync(sourcePath, targetPath);
    console.log(`Moved ${filename} to ${targetDir}`);
  } else {
    console.warn(`File ${sourcePath} not found!`);
  }
}

// Move the payouts folder to admin/payouts/_components
const payoutsSource = path.join(rootDir, 'components', 'shared', 'payouts');
const payoutsTarget = path.join(rootDir, 'app', 'dashboard', 'admin', 'payouts', '_components', 'payouts');
if (fs.existsSync(payoutsSource)) {
  fs.renameSync(payoutsSource, payoutsTarget);
  console.log(`Moved payouts folder to ${payoutsTarget}`);
}

// 2. Walk through all .tsx and .ts files to update imports
function updateImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(file)) {
        updateImports(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      for (const [filename, targetDir] of Object.entries(moves)) {
        // Find imports like "@/components/shared/AdminBookingsList"
        const oldImport = `@/components/shared/${filename}`;
        const newImport = `@/${targetDir}/${filename}`;
        
        if (content.includes(oldImport)) {
          content = content.split(oldImport).join(newImport);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated imports in ${fullPath}`);
      }
    }
  }
}

updateImports(rootDir);
console.log('Done moving and updating imports.');
