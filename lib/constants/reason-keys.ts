export const KNOWN_REASON_KEYS = [
	"cancellation_auto_timeout_unconfirmed",
	"cancellation_report_timeout_forfeited",
	"forfeiture_no_report_96h",
	"ledger_commission_session",
	"ledger_forfeited_frozen_balance"
] as const;

export type RecordReasonKey = typeof KNOWN_REASON_KEYS[number];

export function isKnownReasonKey(v: string | null | undefined): v is RecordReasonKey {
	if (!v) return false;
	return (KNOWN_REASON_KEYS as readonly string[]).includes(v);
}
