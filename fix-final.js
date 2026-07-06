const fs = require('fs');

let wrapper = fs.readFileSync('lib/action-wrapper.ts', 'utf8');
wrapper = wrapper.replace(/t\("common_unknown", \{ fallback: "Unknown" \}\)/g, 't("common_unknown")');
fs.writeFileSync('lib/action-wrapper.ts', wrapper, 'utf8');

let analytics = fs.readFileSync('lib/repositories/analytics-repository.ts', 'utf8');
analytics = analytics.replace(/const urgentAlerts = ghostBookings\.map\(\(b\) => \(\{[\s\S]*?\}\)\);/g, 
`const tNotif = await getNotificationT();
		const urgentAlerts = ghostBookings.map((b) => ({
			id: \`alert-\${b.id}\`,
			bookingId: b.id,
			type: b.reportWarningLevel === 1 ? ("WARNING_1" as const) : ("WARNING_2_FROZEN" as const),
			message: b.reportWarningLevel === 1 ? tNotif("booking_report_warning_message") : tNotif("booking_report_warning_final_message"),
		}));`);

analytics = analytics.replace(/const studentGrades = gradeGroups\.map\(g => \(\{[\s\S]*?\}\)\);/g, 
`const tCommon = await getTranslations("common");
		const studentGrades = gradeGroups.map(g => ({
			name: tCommon("grade_level", { grade: g.grade }),
			value: g._count.grade,
		}));`);

fs.writeFileSync('lib/repositories/analytics-repository.ts', analytics, 'utf8');
console.log('Fixed final 4 errors');
