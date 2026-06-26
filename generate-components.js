const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components/bookings');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// 1. Create NoStudentsState.tsx
fs.writeFileSync(path.join(dir, 'NoStudentsState.tsx'), `import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NoStudentsState() {
  const router = useRouter();
  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto space-y-4">
      <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
      <h3 className="font-extrabold text-lg">لم تقم بإضافة طلاب بعد</h3>
      <p className="text-xs text-muted-foreground">
        يجب عليك إضافة طالب واحد على الأقل لحسابك لتتمكن من حجز الحصص والدروس.
      </p>
      <button
        type="button"
        onClick={() => router.push('/dashboard/parent/students')}
        className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6 py-2.5 rounded-lg cursor-pointer"
      >
        اذهب لإضافة طالب
      </button>
    </div>
  );
}
`);

// 2. Create BookingSuccessState.tsx
fs.writeFileSync(path.join(dir, 'BookingSuccessState.tsx'), `import { CheckCircle } from 'lucide-react';

export function BookingSuccessState() {
  return (
    <div className="bg-card border border-border rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
      <div className="text-center py-8 space-y-3">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold">تم إرسال طلب الحجز بنجاح!</h2>
        <p className="text-xs text-muted-foreground">بانتظار موافقة المعلم وتأكيد الحجز. يتم نقلك الآن...</p>
      </div>
    </div>
  );
}
`);

// 3. Create TrialToggle.tsx
fs.writeFileSync(path.join(dir, 'TrialToggle.tsx'), `export function TrialToggle({ isTrial, onChange }: { isTrial: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900">
      <input
        type="checkbox"
        id="trial"
        checked={isTrial}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
      />
      <label htmlFor="trial" className="text-xs font-bold text-purple-800 dark:text-purple-300 cursor-pointer">
        هل ترغب في حجز هذه الجلسة كـ حصة تجريبية مجانية؟ (30 دقيقة - مرة واحدة لكل ولي أمر)
      </label>
    </div>
  );
}
`);

// 4. Create QuickQuestionFields.tsx
fs.writeFileSync(path.join(dir, 'QuickQuestionFields.tsx'), `export function QuickQuestionFields({
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
`);

console.log("Created 4 UI components");
