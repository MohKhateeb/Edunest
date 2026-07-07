const fs = require('fs');
let upload = fs.readFileSync('app/api/upload/route.ts', 'utf8');

// replace validateUploadRequest declaration
upload = upload.replace('async function validateUploadRequest(\r\n\treq: NextRequest,\r\n\tsession: Session | null,\r\n)', 'async function validateUploadRequest(\r\n\treq: NextRequest,\r\n\tsession: Session | null,\r\n\tt: any\r\n)');
upload = upload.replace('async function validateUploadRequest(\n\treq: NextRequest,\n\tsession: Session | null,\n)', 'async function validateUploadRequest(\n\treq: NextRequest,\n\tsession: Session | null,\n\tt: any\n)');

// replace the error message (using string literal to avoid regex escaping issues)
const targetMsg = '{ error: "نوع الملف غير مسموح به. مسموح بالصور، ملفات PDF، ومقاطع الفيديو الشائعة" }';
const newMsg = '{ error: t("upload_invalid_file_type") }';
upload = upload.replace(targetMsg, newMsg);

// replace the call
upload = upload.replace(/await validateUploadRequest\(req, session\)/g, 'await validateUploadRequest(req, session, t)');

fs.writeFileSync('app/api/upload/route.ts', upload, 'utf8');
console.log('Fixed route.ts');
