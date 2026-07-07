const fs = require('fs');

// 1. Update messages
const ar = JSON.parse(fs.readFileSync('messages/ar.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));

ar.recordReasons = {
  cancellation_auto_timeout_unconfirmed: 'إلغاء تلقائي من النظام: انتهى وقت الجلسة ولم يتم تأكيدها.',
  cancellation_report_timeout_forfeited: 'تخلف المعلم عن كتابة التقرير للمدة القصوى (96 ساعة). تمت المصادرة.',
  forfeiture_no_report_96h: 'مصادرة بسبب عدم تسليم تقرير الجلسة خلال 96 ساعة.',
  ledger_commission_session: 'عمولة جلسة - المعلم: {teacherName}',
  ledger_forfeited_frozen_balance: 'مصادرة رصيد مجمد - المعلم: {teacherName}'
};

en.recordReasons = {
  cancellation_auto_timeout_unconfirmed: 'System auto-cancellation: Session time expired without confirmation.',
  cancellation_report_timeout_forfeited: 'Teacher failed to submit report within maximum duration (96 hours). Forfeited.',
  forfeiture_no_report_96h: 'Forfeited due to failure to submit session report within 96 hours.',
  ledger_commission_session: 'Session Commission - Teacher: {teacherName}',
  ledger_forfeited_frozen_balance: 'Forfeited Frozen Balance - Teacher: {teacherName}'
};

fs.writeFileSync('messages/ar.json', JSON.stringify(ar, null, 2), 'utf8');
fs.writeFileSync('messages/en.json', JSON.stringify(en, null, 2), 'utf8');

// 2. Update booking-cleanup.ts
let cleanup = fs.readFileSync('lib/services/booking-cleanup.ts', 'utf8');
cleanup = cleanup.replace(/cancellationReason: \"إلغاء تلقائي من النظام: انتهى وقت الجلسة ولم يتم تأكيدها\.\"/g, 'cancellationReason: \"cancellation_auto_timeout_unconfirmed\"');
cleanup = cleanup.replace(/cancellationReason: \"تخلف المعلم عن كتابة التقرير للمدة القصوى \(96 ساعة\)\. تمت المصادرة\.\"/g, 'cancellationReason: \"cancellation_report_timeout_forfeited\"');
cleanup = cleanup.replace(/reason: \"مصادرة بسبب عدم تسليم تقرير الجلسة خلال 96 ساعة\.\"/g, 'reason: \"forfeiture_no_report_96h\"');
fs.writeFileSync('lib/services/booking-cleanup.ts', cleanup, 'utf8');

// 3. Update financial-service.ts
let financial = fs.readFileSync('lib/services/domain/financial-service.ts', 'utf8');
financial = financial.replace(/export type PlatformRevenueTransaction = \{/, 'import { RecordReasonKey } from \"@/lib/constants/reason-keys\";\n\nexport type PlatformRevenueTransaction = {');
financial = financial.replace(/description: string;/, 'description: RecordReasonKey;\n\tteacherName: string;');
financial = financial.replace(/description: \`عمولة جلسة \- المعلم: \$\{b\.teacherService\.teacher\.user\.name\}\`/g, 'description: \"ledger_commission_session\",\n\t\t\t\tteacherName: b.teacherService.teacher.user.name');
financial = financial.replace(/description: \`مصادرة رصيد مجمد \- المعلم: \$\{e\.booking\.teacherService\.teacher\.user\.name\}\`/g, 'description: \"ledger_forfeited_frozen_balance\",\n\t\t\tteacherName: e.booking.teacherService.teacher.user.name');
fs.writeFileSync('lib/services/domain/financial-service.ts', financial, 'utf8');

// 4. Update BookingDetails.tsx
let details = fs.readFileSync('components/shared/details/BookingDetails.tsx', 'utf8');
if (!details.includes('import { isKnownReasonKey }')) {
	details = details.replace(/import \{ getTranslations \} from \"next-intl\/server\";/, 'import { getTranslations } from \"next-intl/server\";\nimport { isKnownReasonKey, RecordReasonKey } from \"@/lib/constants/reason-keys\";');
	details = details.replace(/export default async function BookingDetails/, 'export default async function BookingDetails');
	
	// find const t = await getTranslations... to add tReasons
	details = details.replace(/const t = await getTranslations\(\"common\"\);/, 'const t = await getTranslations(\"common\");\n\tconst tReasons = await getTranslations(\"recordReasons\");');
	
	// replace the JSX part
	const fallbackLogic = `
					{booking.cancellationReason && (
						<div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
							<AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
							<p className="text-sm font-medium">
								{isKnownReasonKey(booking.cancellationReason) 
									? tReasons(booking.cancellationReason) 
									: booking.cancellationReason}
							</p>
						</div>
					)}
`;
	// Regex replacement is too complex for JSX multi-line, let's do a substring replace
    const targetJSX = `					{booking.cancellationReason && (
						<div className="flex items-start gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
							<AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
							<p className="text-sm font-medium">
								{booking.cancellationReason}
							</p>
						</div>
					)}`;
	details = details.replace(targetJSX, fallbackLogic);
}
fs.writeFileSync('components/shared/details/BookingDetails.tsx', details, 'utf8');

// 5. Update app/[locale]/dashboard/admin/financials/page.tsx
let financialsPage = fs.readFileSync('app/[locale]/dashboard/admin/financials/page.tsx', 'utf8');
if (!financialsPage.includes('import { isKnownReasonKey }')) {
	financialsPage = financialsPage.replace(/import \{ getAllEscrows \} from \"@\/lib\/services\/domain\/admin-escrow-service\";/, 'import { getAllEscrows } from \"@/lib/services/domain/admin-escrow-service\";\nimport { isKnownReasonKey, RecordReasonKey } from \"@/lib/constants/reason-keys\";');
	
	// add tReasons
	financialsPage = financialsPage.replace(/const t = await getTranslations\('admin'\)/, 'const t = await getTranslations(\'admin\');\n\tconst tReasons = await getTranslations(\'recordReasons\');');
	
	// replace the escrow fallback
	const escrowTarget = `<strong>{t('key_1783109434291_sl0o')}</strong> {escrow.reason}`;
	const escrowReplacement = `<strong>{t('key_1783109434291_sl0o')}</strong> {isKnownReasonKey(escrow.reason) ? tReasons(escrow.reason) : escrow.reason}`;
	financialsPage = financialsPage.replace(escrowTarget, escrowReplacement);
	
	// replace the transaction description
	const descTarget = `<td className="p-4 text-sm">{transaction.description}</td>`;
	const descReplacement = `<td className="p-4 text-sm">{tReasons(transaction.description, { teacherName: transaction.teacherName })}</td>`;
	financialsPage = financialsPage.replace(descTarget, descReplacement);
}
fs.writeFileSync('app/[locale]/dashboard/admin/financials/page.tsx', financialsPage, 'utf8');

console.log('Done script!');
