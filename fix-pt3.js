const fs = require('fs');

// 1. app/api/upload/route.ts
let upload = fs.readFileSync('app/api/upload/route.ts', 'utf8');
if (!upload.includes('upload_invalid_file_type')) {
  // Pass t to validateUploadRequest
  upload = upload.replace(/validateUploadRequest\(\n\t\treq,\n\t\tsession\n\t\)/g, 'validateUploadRequest(req, session, t)');
  upload = upload.replace(/validateUploadRequest\(req, session\)/g, 'validateUploadRequest(req, session, t)');
  
  // Accept t in validateUploadRequest
  upload = upload.replace(/session: Session \| null,\n\): Promise<\{/g, 'session: Session | null,\n\tt: any\n): Promise<{');
  
  // Replace the string
  upload = upload.replace(/\{ error: "نوع الملف غير مسموح به. مسموح بالصور، ملفات PDF، ومقاطع الفيديو الشائعة" \}/g, '{ error: t("upload_invalid_file_type") }');
  
  fs.writeFileSync('app/api/upload/route.ts', upload, 'utf8');
}

// Update messages/ar.json and en.json for upload_invalid_file_type
const ar = JSON.parse(fs.readFileSync('messages/ar.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));

if (!ar.errors.upload_invalid_file_type) {
  ar.errors.upload_invalid_file_type = "نوع الملف غير مسموح به. مسموح بالصور، ملفات PDF، ومقاطع الفيديو الشائعة";
  en.errors.upload_invalid_file_type = "Invalid file type. Allowed: Images, PDF, and common video formats.";
  fs.writeFileSync('messages/ar.json', JSON.stringify(ar, null, 2), 'utf8');
  fs.writeFileSync('messages/en.json', JSON.stringify(en, null, 2), 'utf8');
}

// 2. lib/utils/admin-analytics.ts
let analytics = fs.readFileSync('lib/utils/admin-analytics.ts', 'utf8');
if (!analytics.includes('BOOKING_STATUS_AR')) {
  analytics = 'import { BOOKING_STATUS_AR } from "@/lib/translations";\n' + analytics;
  
  const statusMapTarget = `	const statusMap: Record<string, string> = {
		COMPLETED: "مكتمل",
		CONFIRMED: "مؤكد",
		PENDING: "معلق",
		CANCELLED: "ملغي",
		REJECTED: "مرفوض",
	};`;
  analytics = analytics.replace(statusMapTarget, '');
  
  analytics = analytics.replace(/name: statusMap\[status\] \|\| status/g, 'name: BOOKING_STATUS_AR[status as keyof typeof BOOKING_STATUS_AR] || status');
  
  analytics = analytics.replace(/const spec = "غير محدد";/g, 'const spec = "UNSPECIFIED";');
  analytics = analytics.replace(/const type = b.teacherService\?.serviceType\?.name \|\| "غير محدد";/g, 'const type = b.teacherService?.serviceType?.name || "UNSPECIFIED";');
  
  fs.writeFileSync('lib/utils/admin-analytics.ts', analytics, 'utf8');
}

// 3. lib/utils.ts (formatDuration)
let utils = fs.readFileSync('lib/utils.ts', 'utf8');
if (utils.includes('دقيقة')) {
  const newFormatDuration = `export function formatDuration(minutes: number, locale: string): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;

	const hrFormat = new Intl.NumberFormat(locale, { style: "unit", unit: "hour" });
	const minFormat = new Intl.NumberFormat(locale, { style: "unit", unit: "minute" });
	const listFormat = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });

	if (hours === 0) return minFormat.format(minutes);
	if (mins === 0) return hrFormat.format(hours);

	return listFormat.format([hrFormat.format(hours), minFormat.format(mins)]);
}`;
  
  // Find the old function using regex
  utils = utils.replace(/export function formatDuration\(minutes: number\): string \{[\s\S]*?return `\$\{hours\} ساعة و\$\{mins\} دقيقة`;\n\}/, newFormatDuration);
  
  fs.writeFileSync('lib/utils.ts', utils, 'utf8');
}

console.log('Batch 3 done!');
