const fs = require('fs');

let hook = fs.readFileSync('hooks/useBookingSubmission.ts', 'utf8');

if (!hook.includes('useTranslations')) {
    hook = 'import { useTranslations } from "next-intl";\n' + hook;
}

// Use a more robust replace instead of string literal matching that fails on \r\n
hook = hook.replace(/export function useBookingSubmission\(options\?: BookingSubmissionOptions\) \{\s*const router = useRouter\(\);/m, 
    'export function useBookingSubmission(options?: BookingSubmissionOptions) {\n\tconst t = useTranslations("errors");\n\tconst router = useRouter();');

hook = hook.replace(/setErrorMsg\(res\.error \|\| "حدث خطأ غير معروف"\);/g, 'setErrorMsg(res.error || t("booking_unknown_error"));');
hook = hook.replace(/options\?\.onError\?.\(res\.error \|\| "حدث خطأ غير معروف"\);/g, 'options?.onError?.(res.error || t("booking_unknown_error"));');
hook = hook.replace(/setErrorMsg\("حدث خطأ غير متوقع أثناء إتمام الحجز"\);/g, 'setErrorMsg(t("booking_unexpected_error"));');
hook = hook.replace(/options\?\.onError\?\.\("حدث خطأ غير متوقع أثناء إتمام الحجز"\);/g, 'options?.onError?.(t("booking_unexpected_error"));');

fs.writeFileSync('hooks/useBookingSubmission.ts', hook, 'utf8');

console.log("Hook fixed robustly");
