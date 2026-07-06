const fs = require('fs');

let hook = fs.readFileSync('hooks/useBookingSubmission.ts', 'utf8');

if (!hook.includes('useTranslations')) {
    hook = 'import { useTranslations } from "next-intl";\n' + hook;
}

hook = hook.replace('export function useBookingSubmission(options?: BookingSubmissionOptions) {\n\tconst router = useRouter();', 'export function useBookingSubmission(options?: BookingSubmissionOptions) {\n\tconst t = useTranslations("errors");\n\tconst router = useRouter();');

hook = hook.replace(/setErrorMsg\(res\.error \|\| "حدث خطأ غير معروف"\);/g, 'setErrorMsg(res.error || t("booking_unknown_error"));');
hook = hook.replace(/options\?\.onError\?.\(res\.error \|\| "حدث خطأ غير معروف"\);/g, 'options?.onError?.(res.error || t("booking_unknown_error"));');
hook = hook.replace(/setErrorMsg\("حدث خطأ غير متوقع أثناء إتمام الحجز"\);/g, 'setErrorMsg(t("booking_unexpected_error"));');
hook = hook.replace(/options\?\.onError\?\.\("حدث خطأ غير متوقع أثناء إتمام الحجز"\);/g, 'options?.onError?.(t("booking_unexpected_error"));');

fs.writeFileSync('hooks/useBookingSubmission.ts', hook, 'utf8');

console.log("Hook fixed");
