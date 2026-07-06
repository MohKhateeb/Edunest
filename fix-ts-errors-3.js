const fs = require('fs');

let cancel = fs.readFileSync('lib/actions/bookings/cancel.ts', 'utf8');
cancel = cancel.replace(/error: getTransitionError\(booking\.status, BookingStatus\.CANCELLED\),/g, 'error: await getTransitionError(booking.status, BookingStatus.CANCELLED),');
fs.writeFileSync('lib/actions/bookings/cancel.ts', cancel, 'utf8');

console.log("Fixes 3 applied");
