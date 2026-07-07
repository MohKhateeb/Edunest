const fs = require('fs');
const cp = require('child_process');

const ar = JSON.parse(fs.readFileSync('messages/ar.json', 'utf8'));

const extractKeys = (cmd) => {
    try {
        const out = cp.execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        return [...new Set(out.split('\n')
            .filter(Boolean)
            .map(line => line.match(/t(?:Error|Notification|Reasons|Common)?\(['"]([^'"]+)['"]/))
            .filter(Boolean)
            .map(m => m[1]))];
    } catch (e) { return []; }
};

const errors = extractKeys('git grep -P "tError\\([\'\\"].+?[\'\\"]"');
const notifs = extractKeys('git grep -P "tNotification\\([\'\\"].+?[\'\\"]"');
const reasons = extractKeys('git grep -P "tReasons\\([\'\\"].+?[\'\\"]"');

let missing = false;

errors.forEach(k => {
    if (!ar.errors || !ar.errors[k]) { console.log('MISSING IN ERRORS: ' + k); missing = true; }
});
notifs.forEach(k => {
    if (!ar.notifications || !ar.notifications[k]) { console.log('MISSING IN NOTIFICATIONS: ' + k); missing = true; }
});
reasons.forEach(k => {
    if (!ar.recordReasons || !ar.recordReasons[k]) { console.log('MISSING IN REASONS: ' + k); missing = true; }
});

if (!missing) console.log('ALL KEYS MATCH PERFECTLY!');
