const fs = require('fs');

// 1. lib/utils/booking-state.ts
let bs = fs.readFileSync('lib/utils/booking-state.ts', 'utf8');
bs = 'import { getErrorT } from "@/lib/i18n/get-server-translations";\n' + bs;
bs = bs.replace(/export function getTransitionError/g, 'export async function getTransitionError');
bs = bs.replace(/\): string \{/g, '): Promise<string> {');
bs = bs.replace(/return `لا يمكن تغيير الحجز من "\$\{BOOKING_STATUS_AR\[from\]\}" إلى "\$\{BOOKING_STATUS_AR\[to\]\}"`;/g, 
  "const tError = await getErrorT();\n\treturn tError('booking_invalid_transition', { from: BOOKING_STATUS_AR[from], to: BOOKING_STATUS_AR[to] });");
fs.writeFileSync('lib/utils/booking-state.ts', bs, 'utf8');

// 2. lib/actions/bookings/search.ts
let search = fs.readFileSync('lib/actions/bookings/search.ts', 'utf8');
search = search.replace(/\{ fallback: "غير محدد" \}/g, '');
fs.writeFileSync('lib/actions/bookings/search.ts', search, 'utf8');

// 3. lib/actions/tutoring-requests/create.ts
let create = fs.readFileSync('lib/actions/tutoring-requests/create.ts', 'utf8');
// Replace `map(teacher =>` with `map(async teacher =>`
create = create.replace(/const notificationPromises = matchingTeachers\.map\(\(teacher\) =>/g, 
  "const notificationPromises = matchingTeachers.map(async (teacher) =>");
fs.writeFileSync('lib/actions/tutoring-requests/create.ts', create, 'utf8');

// 4. lib/actions/tutoring-requests/instant-book.ts
let instantBook = fs.readFileSync('lib/actions/tutoring-requests/instant-book.ts', 'utf8');
instantBook = instantBook.replace(/\{ fallback: "خدمة فوري \(Live Radar\)" \}/g, '');
instantBook = instantBook.replace(/\{ teacherName: teacher\.user\.name \}/g, '{ teacherName: teacher.user.name || "" }');
fs.writeFileSync('lib/actions/tutoring-requests/instant-book.ts', instantBook, 'utf8');

console.log("Fixes applied");
