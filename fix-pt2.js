const fs = require('fs');
let content = fs.readFileSync('components/shared/details/BookingDetails.tsx', 'utf8');

// 1. Add import
if (!content.includes('import { isKnownReasonKey }')) {
  content = content.replace(/import \{ useTranslations \} from "next-intl";/, 'import { useTranslations } from "next-intl";\nimport { isKnownReasonKey } from "@/lib/constants/reason-keys";');
}

// 2. Add tReasons
if (!content.includes("const tReasons = useTranslations('recordReasons')")) {
  content = content.replace(/const t = useTranslations\('common'\);/, 'const t = useTranslations(\'common\');\n\tconst tReasons = useTranslations(\'recordReasons\');');
}

// 3. Replace the JSX line
const targetJSX = '"{booking.cancellationReason}"';
const newJSX = '{isKnownReasonKey(booking.cancellationReason) ? tReasons(booking.cancellationReason) : booking.cancellationReason}';
content = content.replace(targetJSX, newJSX);

fs.writeFileSync('components/shared/details/BookingDetails.tsx', content, 'utf8');
console.log('Fixed BookingDetails.tsx');
