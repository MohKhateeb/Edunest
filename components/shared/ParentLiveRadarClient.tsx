'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createTutoringRequest } from '@/lib/actions/tutoring-requests/create';
import { checkLiveRequestMatch } from '@/lib/actions/tutoring-requests/status';
import { 
  Search, Zap, Loader2, BookOpen, UserCircle, Rocket 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  grade: number;
}

interface ServiceType {
  id: string;
  name: string;
  fazaaPrice: number;
  fazaaDuration: number;
}

interface ParentLiveRadarClientProps {
  students: Student[];
  serviceTypes: ServiceType[];
  subjects: { id: string; name: string }[];
}

export default function ParentLiveRadarClient({ students, serviceTypes, subjects }: ParentLiveRadarClientProps) {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    studentId: students[0]?.id || '',
    serviceTypeId: serviceTypes[0]?.id || '',
    subjectId: subjects[0]?.id || '',
    title: '',
    details: '',
  });

  const selectedServiceType = serviceTypes.find(s => s.id === formData.serviceTypeId) || serviceTypes[0];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.title || !formData.subjectId) {
      toast.error('يرجى تعبئة الحقول الأساسية لطلب الفزعة!');
      return;
    }

    setIsSearching(true);
    toast.loading('جاري بث طلبك لجميع المعلمين المتاحين الآن... 📡', { id: 'live-request' });

    try {
      const res = await createTutoringRequest(formData);
      if (res.success && res.data) {
        toast.success('تم إرسال الطلب بنجاح! نحن نبحث لك عن المعلم الأسرع...', { id: 'live-request' });
        setActiveRequestId(res.data.requestId);
      } else {
        toast.error(!res.success ? res.error : 'حدث خطأ أثناء الطلب', { id: 'live-request' });
        setIsSearching(false);
      }
    } catch (err) {
      toast.error('خطأ غير متوقع', { id: 'live-request' });
      setIsSearching(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSearching && activeRequestId) {
      interval = setInterval(async () => {
        try {
          const res = await checkLiveRequestMatch(activeRequestId);
          if (res.success && res.data?.isMatched && res.data.bookingId) {
            clearInterval(interval);
            toast.success('تم العثور على معلم! جاري توجيهك للجلسة...', { id: 'live-match' });
            router.push(`/dashboard/session/${res.data.bookingId}`);
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000); // يفحص كل 3 ثواني
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSearching, activeRequestId, router]);

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping scale-150"></div>
          <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping scale-110" style={{ animationDelay: '0.5s' }}></div>
          <div className="relative bg-white dark:bg-slate-900 p-8 rounded-full border-4 border-indigo-500 shadow-2xl shadow-indigo-500/50">
            <Search className="w-16 h-16 text-indigo-500 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">
            رادار EduNest يعمل 📡
          </h2>
          <p className="text-lg text-slate-500 max-w-md mx-auto">
            لقد تم بث طلبك بنجاح! ننتظر الآن أول معلم متصل ليقوم بالتقاطه. يرجى الانتظار، سيتم نقلك تلقائياً.
          </p>
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-8 text-white mb-8 shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-black mb-2 flex items-center gap-2">
              فزعة سريعة <Zap className="w-8 h-8 text-yellow-300" />
            </h2>
            <p className="text-indigo-100 max-w-md">
              هل يواجه ابنك صعوبة في فهم موضوع معين الآن؟ اطلب فزعة وسنقوم بربطك فوراً بأول معلم متاح!
            </p>
          </div>
          <Rocket className="w-24 h-24 text-white/20 hidden md:block" />
        </div>
      </div>

      <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-10 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-indigo-500" /> الطالب
            </label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 outline-none transition-colors"
              required
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} (الصف {s.grade})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-500" /> المادة / التخصص
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-purple-500 outline-none transition-colors"
              required
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> نوع الجلسة (المدة والسعر)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {serviceTypes.map((st) => (
              <label 
                key={st.id} 
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all",
                  formData.serviceTypeId === st.id 
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" 
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="serviceType" 
                    value={st.id}
                    checked={formData.serviceTypeId === st.id}
                    onChange={() => setFormData({ ...formData, serviceTypeId: st.id })}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{st.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{st.fazaaDuration} دقيقة</div>
                  </div>
                </div>
                <div className="font-black text-indigo-600 dark:text-indigo-400">
                  {st.fazaaPrice} ₪
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">ما هو السؤال أو الموضوع؟ (باختصار)</label>
          <input
            type="text"
            placeholder="مثال: مساعدة في حل معادلة من الدرجة الثانية"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 outline-none transition-colors font-semibold"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-2xl font-black text-xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-slate-900/20 dark:shadow-indigo-500/20"
        >
          <Search className="w-6 h-6 text-indigo-400 dark:text-white" />
          ابحث عن معلم الآن ({selectedServiceType?.fazaaPrice} ₪)
        </button>
      </form>
    </div>
  );
}
