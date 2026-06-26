export function QuickQuestionFields({
  title,
  details,
  onChange
}: {
  title: string;
  details: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div className="bg-accent/40 border border-border rounded-xl p-4 space-y-3 animate-fadeIn">
      <h3 className="text-xs font-bold text-primary">بيانات المسألة السريعة المطلوب شرحها:</h3>
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-muted-foreground block">عنوان السؤال / المسألة *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => onChange('questionTitle', e.target.value)}
          placeholder="مثال: حل معادلة تفاضلية من الدرجة الثانية"
          className="w-full premium-input text-xs"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-muted-foreground block">تفاصيل المسألة أو الواجب الدراسي *</label>
        <textarea
          required
          rows={3}
          value={details}
          onChange={(e) => onChange('questionDetails', e.target.value)}
          placeholder="اكتب تفاصيل المسألة الحسابية أو الدرس المطلوب شرحه بالتفصيل..."
          className="w-full premium-input text-xs resize-none"
        />
      </div>
    </div>
  );
}
