export function TrialToggle({
	isTrial,
	onChange,
}: {
	isTrial: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900">
			<input
				type="checkbox"
				id="trial"
				checked={isTrial}
				onChange={(e) => onChange(e.target.checked)}
				className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
			/>
			<label
				htmlFor="trial"
				className="text-xs font-bold text-purple-800 dark:text-purple-300 cursor-pointer"
			>
				هل ترغب في حجز هذه الجلسة كـ حصة تجريبية مجانية؟ (30 دقيقة - مرة واحدة
				لكل ولي أمر)
			</label>
		</div>
	);
}
