const fs = require('fs');

const arErrors = {
  "غير مصرح لك بالاطلاع على هذا الطالب لعدم وجود حجوزات مشتركة بينكما.": "auth_unauthorized_student_access",
  "غير مصرح لك بمشاهدة تفاصيل هذا الحجز.": "auth_unauthorized_booking_view",
  "غير مصرح لك بمشاهدة تفاصيل حجز خاص بمعلم آخر.": "auth_unauthorized_other_teacher_booking",
  "غير مصرح لك بتقييم هذا الحجز": "auth_unauthorized_review",
  "غير مصرح.": "auth_unauthorized",
  "المحادثة مغلقة من قبل الإدارة حالياً.": "auth_chat_closed_admin",
  "عذراً، الإدارة تنتظر رد ولي الأمر الآن. لا يمكنك الإرسال.": "auth_chat_waiting_parent",
  "عذراً، الإدارة تنتظر رد المعلم الآن. لا يمكنك الإرسال.": "auth_chat_waiting_teacher",
  "غير مصرح لك بالاطلاع على تسوية مالية خاصة بمعلم آخر.": "auth_unauthorized_other_teacher_payout",
  "غير مصرح لك بمشاهدة تفاصيل التسويات المالية.": "auth_unauthorized_payout_view",
};

// Replace Arabic strings in authorization.ts with Keys
let authContent = fs.readFileSync('lib/auth/authorization.ts', 'utf8');
for (const [ar, key] of Object.entries(arErrors)) {
  // Escape for regex or just string replace. Since they appear exactly, we can just split and join.
  authContent = authContent.split('"' + ar + '"').join('"' + key + '"');
}
fs.writeFileSync('lib/auth/authorization.ts', authContent, 'utf8');

// Now, recursively find callers of these guards in lib/actions
function processDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = dir + '/' + file;
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Pattern: if (!authRes.authorized) return { success: false, error: authRes.error };
            // Since variable names vary, we'll look for: error: (.*?)\.error
            // Or simpler, just `authRes.error` -> `await (async () => { const t = await getErrorT(); return t(authRes.error as any); })()`
            // Wait, we need to import getErrorT. Let's do it carefully.
            
            // Let's use a regex to replace `error: ([a-zA-Z0-9_]+)\.error` when preceded by `if (!\1.authorized)`
            // This is safer.
            let changed = false;
            content = content.replace(/if\s*\(!([a-zA-Z0-9_]+)\.authorized\)\s*return\s*\{\s*success:\s*false,\s*error:\s*\1\.error\s*\}/g, (match, varName) => {
                changed = true;
                return `if (!${varName}.authorized) return { success: false, error: await (async () => { const t = await getErrorT(); return t(${varName}.error as any); })() }`;
            });
            content = content.replace(/if\s*\(!([a-zA-Z0-9_]+)\.authorized\)\s*\{\s*return\s*\{\s*success:\s*false,\s*error:\s*\1\.error\s*\}\s*;/g, (match, varName) => {
                changed = true;
                return `if (!${varName}.authorized) { return { success: false, error: await (async () => { const t = await getErrorT(); return t(${varName}.error as any); })() };`;
            });

            if (changed) {
                if (!content.includes('getErrorT')) {
                    content = 'import { getErrorT } from "@/lib/i18n/get-server-translations";\n' + content;
                }
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated callers in ${fullPath}`);
            }
        }
    });
}
processDirectory('lib/actions');
