const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let match = content.match(/^import { useTranslations } from "next-intl";(\r?\n)+("use client";|'use client';)/m);
            if (match) {
                console.log(`Fixing ${fullPath}`);
                content = content.replace(match[0], `${match[2]}\nimport { useTranslations } from "next-intl";`);
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}

processDir('app');
console.log('Done fixing use client directives');
