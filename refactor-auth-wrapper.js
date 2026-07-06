const fs = require('fs');

// 1. require-auth.ts
let reqAuth = fs.readFileSync('lib/require-auth.ts', 'utf8');
reqAuth = reqAuth.replace(/"يجب تسجيل الدخول"/g, '"auth_unauthorized_login_required"');
reqAuth = reqAuth.replace(/"حسابك معطل أو غير موجود"/g, '"auth_unauthorized_account_disabled"');
reqAuth = reqAuth.replace(/"غير مصرح لك بهذا الإجراء"/g, '"auth_forbidden_action"');
fs.writeFileSync('lib/require-auth.ts', reqAuth, 'utf8');

// 2. action-wrapper.ts
let actWrapper = fs.readFileSync('lib/action-wrapper.ts', 'utf8');
if (!actWrapper.includes('getErrorT')) {
    actWrapper = 'import { getErrorT } from "@/lib/i18n/get-server-translations";\n' + actWrapper;
}
actWrapper = actWrapper.replace(
    /if\s*\(err instanceof AuthError\)\s*\{\s*return\s*\{\s*success:\s*false,\s*error:\s*err\.message\s*\}\s*;\s*\}/g,
    'if (err instanceof AuthError) {\n\t\t\t\tconst t = await getErrorT();\n\t\t\t\treturn { success: false, error: t(err.message as any, undefined, { fallback: err.message }) };\n\t\t\t}'
);
actWrapper = actWrapper.replace(
    /const msg = err instanceof Error \? err\.message : "حدث خطأ غير متوقع";\s*return { success: false, error: msg };/g,
    'const t = await getErrorT();\n\t\t\tconst msg = err instanceof Error ? err.message : t("unexpected_error");\n\t\t\treturn { success: false, error: msg };'
);
fs.writeFileSync('lib/action-wrapper.ts', actWrapper, 'utf8');

console.log('require-auth and action-wrapper updated');
