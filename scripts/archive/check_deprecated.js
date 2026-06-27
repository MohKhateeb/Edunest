const { execSync } = require('child_process');
const fs = require('fs');

const pkgLockPath = './package-lock.json';
if (!fs.existsSync(pkgLockPath)) {
  console.log('package-lock.json not found');
  process.exit(1);
}

const lockData = JSON.parse(fs.readFileSync(pkgLockPath, 'utf8'));
const packages = lockData.packages || {};

console.log("Analyzing lockfile for known deprecated packages...");

const knownDeprecated = [];

for (const [key, details] of Object.entries(packages)) {
  if (key === '') continue;
  const name = key.replace(/.*node_modules\//, '');
  // Checking typical deprecated packages often found in Next/React apps
  if (name === 'uuid' && details.version.startsWith('8.')) {
    knownDeprecated.push(`uuid@${details.version} (via ${key})`);
  }
  if (name === 'punycode' && details.version.startsWith('1.')) {
    knownDeprecated.push(`punycode@${details.version} (via ${key})`);
  }
  if (name === 'inflight') {
    knownDeprecated.push(`inflight@${details.version} (via ${key})`);
  }
  if (name === 'rimraf' && details.version.startsWith('2.')) {
    knownDeprecated.push(`rimraf@${details.version} (via ${key})`);
  }
  if (name === 'glob' && details.version.startsWith('7.')) {
    knownDeprecated.push(`glob@${details.version} (via ${key})`);
  }
}

if (knownDeprecated.length > 0) {
  console.log("Found potentially deprecated/legacy sub-dependencies:");
  knownDeprecated.forEach(p => console.log("- " + p));
} else {
  console.log("No common deprecated packages found.");
}
