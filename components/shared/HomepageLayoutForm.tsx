'use client';

import { useState } from 'react';
import { updateHomepageLayout } from '@/lib/actions/admin';
import { 
  Save, Loader2, AlertCircle, ArrowUp, ArrowDown, Trash2, 
  Plus, Eye, EyeOff, Sparkles, HelpCircle, Check, Settings 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type SectionType = 
  | 'hero' 
  | 'stats' 
  | 'subjects' 
  | 'features' 
  | 'how_it_works' 
  | 'featured_teachers' 
  | 'testimonials' 
  | 'faq'
  | 'cta' 
  | 'custom_html';

interface Section {
  id: string;
  type: SectionType;
  enabled: boolean;
  props: Record<string, any>;
}

const SECTION_TYPE_LABELS: Record<SectionType, { label: string; desc: string }> = {
  hero: { label: 'القسم التعريفي الأول (Hero)', desc: 'الواجهة الرئيسية وعنوان الترحيب مع شارة ترويجية وأزرار البحث والتسجيل.' },
  stats: { label: 'شريط الإحصائيات (Stats Bar)', desc: 'شريط الأرقام والعدادات التفاعلية (معلمين، طلاب، جلسات ناجحة).' },
  subjects: { label: 'المواد الأكثر طلباً (Subjects Selector)', desc: 'شارات للمواد الدراسية الشائعة لتسهيل البحث الفوري.' },
  features: { label: 'مميزات المنصة (Features)', desc: 'بطاقات توضيحية لخدمات ومميزات المنصة (الأمان، الجلسات المجانية، الدفع).' },
  how_it_works: { label: 'كيف يعمل الموقع (How It Works)', desc: 'خطوات حجز الجلسات وحضورها بالتفصيل للأهالي والطلاب.' },
  featured_teachers: { label: 'معلمون مميزون (Featured Teachers)', desc: 'جلب تلقائي لأكثر المعلمين تقييماً وتوثيقاً من قاعدة البيانات.' },
  testimonials: { label: 'آراء أولياء الأمور (Testimonials)', desc: 'آراء وتقييمات حقيقية من أهالي الطلاب المستفيدين.' },
  faq: { label: 'الأسئلة الشائعة (FAQ Accordion)', desc: 'أسئلة تفاعلية شائعة تسحب تلقائياً من قاعدة البيانات.' },
  cta: { label: 'دعوة للتسجيل الفوري (CTA)', desc: 'بانر تشجيعي سفلي يوجه الزوار للتسجيل الفوري كمعلم أو كأب.' },
  custom_html: { label: 'قسم HTML مخصص (Custom HTML)', desc: 'إضافة فيديو تعريفي أو كود HTML مخصص من قبل الأدمن.' }
};

// أيقونات Lucide المقترحة للميزات
const AVAILABLE_ICONS = [
  'ShieldCheck', 'CalendarCheck', 'GraduationCap', 'CreditCard', 
  'Star', 'FileText', 'Sparkles', 'BookOpen', 'Heart', 
  'Smile', 'Trophy', 'Users', 'Video', 'Clock', 'Award'
];

const DEFAULT_LAYOUT: Section[] = [
  {
    id: 'hero',
    type: 'hero',
    enabled: true,
    props: {
      badgeText: 'جديد',
      badgeMessage: 'جلستك التجريبية الأولى مجانية تماماً 🎉',
      headline: 'ابحث عن معلمك المثالي في الضفة الغربية',
      subheadline: 'منصة إديونست تربطك بمعلمين خصوصيين موثّقين لجميع المواد والمراحل الدراسية. حجز سهل، دفع آمن، ومتابعة مستمرة لتقدم طفلك.',
      primaryBtnText: 'ابحث عن معلم',
      primaryBtnLink: '/teachers',
      secondaryBtnText: 'سجّل كمعلم',
      secondaryBtnLink: '/register'
    }
  },
  {
    id: 'stats',
    type: 'stats',
    enabled: true,
    props: {
      items: [
        { label: 'معلم موثّق', value: 200, suffix: '+' },
        { label: 'جلسة ناجحة', value: 5000, suffix: '+' },
        { label: 'طالب مستفيد', value: 1200, suffix: '+' },
        { label: 'مدينة تغطيتها', value: 15, suffix: '+' }
      ]
    }
  },
  {
    id: 'subjects',
    type: 'subjects',
    enabled: true,
    props: {
      title: 'المواد الأكثر طلباً',
      subjects: [
        'رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'عربي', 'إنجليزي',
        'تاريخ', 'جغرافيا', 'دين', 'معلوماتية', 'اقتصاد', 'محاسبة'
      ]
    }
  },
  {
    id: 'features',
    type: 'features',
    enabled: true,
    props: {
      title: 'لماذا إديونست؟',
      subtitle: 'صممنا المنصة لتوفر تجربة تعليمية موثوقة وممتعة ومنظمة للأهل والطلاب على حد سواء.',
      items: [
        { iconName: 'ShieldCheck', title: 'معلمون موثّقون', desc: 'نتحقق من هوية كل معلم وشهاداته الأكاديمية قبل قبوله في المنصة.' },
        { iconName: 'CalendarCheck', title: 'حجز فوري وسهل', desc: 'اختر المعلم المناسب واحجز جلستك في دقائق معدودة دون أي تعقيد.' },
        { iconName: 'GraduationCap', title: 'جلسة تجريبية مجانية', desc: 'جرّب أول جلسة مجاناً مع كل معلم لتطمئن على أسلوبه قبل الالتزام.' },
        { iconName: 'CreditCard', title: 'دفع آمن ومحمي', desc: 'نقبل التحويل البنكي والدفع الإلكتروني مع ضمان استرداد المبلغ عند الإلغاء.' },
        { iconName: 'Star', title: 'تقييمات حقيقية', desc: 'اقرأ آراء الأهالي الحقيقية واختر المعلم الأعلى تقييماً في تخصصه.' },
        { iconName: 'FileText', title: 'تقارير الحصص', desc: 'يرسل لك المعلم تقريراً بعد كل حصة يشمل المواضيع والأداء والواجبات.' }
      ]
    }
  },
  {
    id: 'how_it_works',
    type: 'how_it_works',
    enabled: true,
    props: {
      title: 'كيف يعمل إديونست؟',
      subtitle: 'ثلاث خطوات بسيطة ويكون طفلك في أفضل أيدٍ أمينة',
      items: [
        { num: '١', title: 'ابحث عن معلم', desc: 'اكتب التخصص والمدينة واختر من قائمة المعلمين الموثّقين.' },
        { num: '٢', title: 'احجز جلستك', desc: 'اختر الوقت المناسب واحجز جلستك التجريبية المجانية فوراً.' },
        { num: '٣', title: 'تعلّم وتقدّم', desc: 'احضر حصتك واحصل على تقرير مفصّل بعد كل جلسة.' }
      ]
    }
  },
  {
    id: 'featured_teachers',
    type: 'featured_teachers',
    enabled: true,
    props: {
      title: 'معلمون مميزون',
      subtitle: 'الأعلى تقييماً من قِبل أولياء الأمور',
      limit: 6
    }
  },
  {
    id: 'testimonials',
    type: 'testimonials',
    enabled: true,
    props: {
      title: 'ماذا يقول أولياء الأمور؟',
      subtitle: 'تجارب حقيقية من عائلات استفادت من خدماتنا',
      items: [
        { text: 'أفضل منصة للبحث عن معلمين. ابني تحسن في الرياضيات بشكل ملحوظ بعد 3 حصص فقط!', author: 'أم أحمد', city: 'رام الله' },
        { text: 'سهولة في الحجز ومصداقية عالية. التقرير بعد كل جلسة يريحني جداً وأعرف أين وصل طفلي.', author: 'أبو يوسف', city: 'نابلس' },
        { text: 'الأساتذة هنا محترفون جداً. الجلسة التجريبية فكرة رائعة ساعدتنا في اختيار المعلم الأنسب.', author: 'أم سارة', city: 'الخليل' }
      ]
    }
  },
  {
    id: 'faq',
    type: 'faq',
    enabled: true,
    props: {
      title: 'الأسئلة الشائعة',
      subtitle: 'كل ما ترغب بمعرفته حول كيفية الحجز والتعامل مع المنصة'
    }
  },
  {
    id: 'cta',
    type: 'cta',
    enabled: true,
    props: {
      title: 'ابدأ رحلة طفلك التعليمية اليوم',
      subtitle: 'سجّل مجاناً، تصفح المعلمين، واحجز جلستك التجريبية دون أي التزام.',
      primaryBtnText: '🚀 سجّل الآن مجاناً',
      primaryBtnLink: '/register',
      secondaryBtnText: 'تصفح المعلمين',
      secondaryBtnLink: '/teachers'
    }
  }
];

export default function HomepageLayoutForm({ initialLayoutJson }: { initialLayoutJson: string | null }) {
  const router = useRouter();
  
  // فك تشفير التخطيط الحالي أو استخدام الافتراضي
  const getInitialLayout = (): Section[] => {
    if (!initialLayoutJson) return DEFAULT_LAYOUT;
    try {
      const parsed = JSON.parse(initialLayoutJson) as Section[];
      // دمج الأقسام للتأكد من وجود جميع الحقول
      return parsed;
    } catch {
      return DEFAULT_LAYOUT;
    }
  };

  const [sections, setSections] = useState<Section[]>(getInitialLayout());
  const [activeTab, setActiveTab] = useState<string | null>(sections[0]?.id || null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newSectionType, setNewSectionType] = useState<SectionType>('custom_html');

  // تحريك القسم للأعلى
  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSections(updated);
  };

  // تحريك القسم للأسفل
  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSections(updated);
  };

  // حذف قسم
  const deleteSection = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك بحذف هذا القسم من الصفحة الرئيسية؟')) {
      const updated = sections.filter((s) => s.id !== id);
      setSections(updated);
      if (activeTab === id) {
        setActiveTab(updated[0]?.id || null);
      }
    }
  };

  // تفعيل / تعطيل القسم
  const toggleEnabled = (id: string) => {
    const updated = sections.map((s) => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setSections(updated);
  };

  // تحديث القيم العادية للأقسام
  const updateProp = (sectionId: string, propKey: string, value: any) => {
    const updated = sections.map((s) => {
      if (s.id === sectionId) {
        return {
          ...s,
          props: {
            ...s.props,
            [propKey]: value
          }
        };
      }
      return s;
    });
    setSections(updated);
  };

  // تحديث القيم بداخل عناصر القائمة الفرعية (أقسام المميزات، الإحصائيات، إلخ)
  const updateItemInProp = (sectionId: string, propKey: string, itemIndex: number, field: string, value: any) => {
    const updated = sections.map((s) => {
      if (s.id === sectionId) {
        const items = [...(s.props[propKey] || [])];
        items[itemIndex] = {
          ...items[itemIndex],
          [field]: value
        };
        return {
          ...s,
          props: {
            ...s.props,
            [propKey]: items
          }
        };
      }
      return s;
    });
    setSections(updated);
  };

  // حذف عنصر فرعي
  const deleteItemInProp = (sectionId: string, propKey: string, itemIndex: number) => {
    const updated = sections.map((s) => {
      if (s.id === sectionId) {
        const items = (s.props[propKey] || []).filter((_: any, idx: number) => idx !== itemIndex);
        return {
          ...s,
          props: {
            ...s.props,
            [propKey]: items
          }
        };
      }
      return s;
    });
    setSections(updated);
  };

  // إضافة عنصر فرعي
  const addItemInProp = (sectionId: string, propKey: string, defaultFields: Record<string, any>) => {
    const updated = sections.map((s) => {
      if (s.id === sectionId) {
        const items = [...(s.props[propKey] || []), defaultFields];
        return {
          ...s,
          props: {
            ...s.props,
            [propKey]: items
          }
        };
      }
      return s;
    });
    setSections(updated);
  };

  // إضافة قسم جديد
  const addNewSection = () => {
    const uniqueId = `${newSectionType}_${Date.now()}`;
    let defaultProps: Record<string, any> = {};

    switch (newSectionType) {
      case 'custom_html':
        defaultProps = { title: 'قسم مخصص جديد', html: '<div class="py-12 text-center bg-gray-50 dark:bg-zinc-900 border rounded-2xl"> محتوى مخصص </div>' };
        break;
      case 'hero':
        defaultProps = { headline: 'عنوان البانر الرئيسي', subheadline: 'وصف قصير للبانر', primaryBtnText: 'رابط رئيسي', primaryBtnLink: '#', secondaryBtnText: 'رابط فرعي', secondaryBtnLink: '#' };
        break;
      case 'stats':
        defaultProps = { items: [{ label: 'عنصر إحصائي', value: 100, suffix: '+' }] };
        break;
      case 'subjects':
        defaultProps = { title: 'المواد الدراسية', subjects: ['رياضيات', 'عربي'] };
        break;
      case 'features':
        defaultProps = { title: 'ميزاتنا', subtitle: 'وصف المميزات', items: [{ iconName: 'ShieldCheck', title: 'ميزة جديدة', desc: 'تفاصيل الميزة' }] };
        break;
      case 'how_it_works':
        defaultProps = { title: 'طريقة العمل', subtitle: 'شرح بسيط', items: [{ num: '١', title: 'خطوة أولى', desc: 'تفاصيل الخطوة' }] };
        break;
      case 'featured_teachers':
        defaultProps = { title: 'معلمون مميزون', subtitle: 'الأعلى تقييماً', limit: 6 };
        break;
      case 'testimonials':
        defaultProps = { title: 'تجارب مستخدمين', subtitle: 'ماذا قالوا عنا', items: [{ text: 'محتوى التقييم', author: 'الاسم', city: 'المدينة' }] };
        break;
      case 'faq':
        defaultProps = { title: 'الأسئلة الشائعة', subtitle: 'استفسارات شائعة' };
        break;
      case 'cta':
        defaultProps = { title: 'انضم إلينا الآن', subtitle: 'سجل فوراً بالمنصة', primaryBtnText: 'سجل كطالب', primaryBtnLink: '/register', secondaryBtnText: 'سجل كمعلم', secondaryBtnLink: '/register' };
        break;
    }

    const newSec: Section = {
      id: uniqueId,
      type: newSectionType,
      enabled: true,
      props: defaultProps
    };

    setSections([...sections, newSec]);
    setActiveTab(uniqueId);
    setSuccessMsg('تمت إضافة القسم بنجاح، يمكنك الآن تعديل محتوياته وحفظ التخطيط.');
  };

  // حفظ التخطيط بالكامل
  const handleSave = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const layoutJson = JSON.stringify(sections);
    const res = await updateHomepageLayout(layoutJson);
    
    setLoading(false);
    if (res.success) {
      setSuccessMsg('تم حفظ وتحديث تخطيط ومحتوى الصفحة الرئيسية بنجاح ✓');
      router.refresh();
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* القائمة الجانبية للأقسام وترتيبها */}
      <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm h-fit">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-foreground">
            <Settings className="w-4 h-4 text-primary" /> أقسام الصفحة الرئيسية
          </h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
            {sections.length} أقسام
          </span>
        </div>

        {/* قائمة الأقسام القابلة للترتيب والتحكم */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {sections.map((section, index) => {
            const isActive = activeTab === section.id;
            const labelInfo = SECTION_TYPE_LABELS[section.type];

            return (
              <div 
                key={section.id} 
                className={`p-3 rounded-lg border text-xs flex flex-col gap-2 transition-all cursor-pointer ${
                  isActive 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-border bg-muted/20 hover:bg-muted/40'
                }`}
                onClick={() => setActiveTab(section.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEnabled(section.id);
                      }}
                      className={`p-1 rounded-md transition-colors ${
                        section.enabled 
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100' 
                          : 'text-muted-foreground bg-muted hover:bg-muted/80'
                      }`}
                      title={section.enabled ? 'إخفاء القسم' : 'إظهار القسم'}
                    >
                      {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <span className="font-bold text-foreground truncate block">
                      {labelInfo?.label || section.type}
                    </span>
                  </div>

                  {/* أزرار الترتيب والحذف */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => moveUp(index)} 
                      disabled={index === 0} 
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-muted"
                      title="نقل للأعلى"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => moveDown(index)} 
                      disabled={index === sections.length - 1} 
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-muted"
                      title="نقل للأسفل"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => deleteSection(section.id)} 
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded"
                      title="حذف القسم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {!section.enabled && (
                  <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    (مخفي من الصفحة الرئيسية)
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* إضافة قسم جديد */}
        <div className="border-t border-border pt-4 space-y-3">
          <label className="text-[11px] font-bold text-muted-foreground block">إضافة قسم جديد للصفحة:</label>
          <div className="flex gap-2">
            <select
              value={newSectionType}
              onChange={(e) => setNewSectionType(e.target.value as SectionType)}
              className="flex-1 premium-input text-xs"
            >
              {Object.entries(SECTION_TYPE_LABELS).map(([type, value]) => (
                <option key={type} value={type}>{value.label.split(' (')[0]}</option>
              ))}
            </select>
            <button 
              onClick={addNewSection}
              className="bg-primary/10 text-primary hover:bg-primary/20 p-2.5 rounded-lg transition-colors cursor-pointer"
              title="إضافة القسم"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* زر الحفظ النهائي */}
        <div className="border-t border-border pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري حفظ التخطيط...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ ونشر التخطيط للموقع
              </>
            )}
          </button>
        </div>
      </div>

      {/* لوحة تحرير خصائص القسم النشط */}
      <div className="lg:col-span-2 space-y-6">
        
        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-4 py-3 rounded-xl border border-destructive/20 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900 animate-fade-in">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {activeTab ? (
          (() => {
            const section = sections.find((s) => s.id === activeTab);
            if (!section) return <div className="bg-card border rounded-xl p-8 text-center text-xs text-muted-foreground">القسم غير موجود.</div>;
            const labelInfo = SECTION_TYPE_LABELS[section.type];

            return (
              <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm animate-fade-in">
                
                {/* ترويسة محرر القسم */}
                <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-extrabold text-base text-foreground flex items-center gap-2">
                      <span>تعديل محتوى: {labelInfo?.label || section.type}</span>
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                        ID: {section.id}
                      </span>
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {labelInfo?.desc}
                    </p>
                  </div>
                </div>

                {/* الحقول المتاحة للقسم */}
                <div className="space-y-5">
                  
                  {/* قسم Hero */}
                  {section.type === 'hero' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">شارة البانر الترويجية (مثال: جديد)</label>
                        <input
                          type="text"
                          value={section.props.badgeText || ''}
                          onChange={(e) => updateProp(section.id, 'badgeText', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">نص الشارة الترويجية</label>
                        <input
                          type="text"
                          value={section.props.badgeMessage || ''}
                          onChange={(e) => updateProp(section.id, 'badgeMessage', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-bold text-muted-foreground block">العنوان العريض (Headline)</label>
                        <input
                          type="text"
                          value={section.props.headline || ''}
                          onChange={(e) => updateProp(section.id, 'headline', e.target.value)}
                          className="w-full premium-input text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-bold text-muted-foreground block">الوصف والتفاصيل (Subheadline)</label>
                        <textarea
                          rows={3}
                          value={section.props.subheadline || ''}
                          onChange={(e) => updateProp(section.id, 'subheadline', e.target.value)}
                          className="w-full premium-input text-xs leading-relaxed resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">نص زر الدعوة الرئيسي</label>
                        <input
                          type="text"
                          value={section.props.primaryBtnText || ''}
                          onChange={(e) => updateProp(section.id, 'primaryBtnText', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">رابط زر الدعوة الرئيسي</label>
                        <input
                          type="text"
                          value={section.props.primaryBtnLink || ''}
                          onChange={(e) => updateProp(section.id, 'primaryBtnLink', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">نص الزر الثانوي</label>
                        <input
                          type="text"
                          value={section.props.secondaryBtnText || ''}
                          onChange={(e) => updateProp(section.id, 'secondaryBtnText', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">رابط الزر الثانوي</label>
                        <input
                          type="text"
                          value={section.props.secondaryBtnLink || ''}
                          onChange={(e) => updateProp(section.id, 'secondaryBtnLink', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* قسم الإحصائيات (Stats Bar) */}
                  {section.type === 'stats' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-foreground">قائمة الإحصائيات والأرقام</h4>
                        <button
                          onClick={() => addItemInProp(section.id, 'items', { label: 'إحصائية جديدة', value: 10, suffix: '+' })}
                          className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all"
                        >
                          <Plus className="w-3 h-3" /> إضافة رقم إحصائي
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(section.props.items || []).map((item: any, idx: number) => (
                          <div key={idx} className="flex flex-col md:flex-row items-center gap-3 p-3 bg-muted/20 border border-border rounded-xl">
                            <div className="flex-1 space-y-1 w-full">
                              <label className="text-[10px] text-muted-foreground block font-bold">اسم الإحصائية</label>
                              <input
                                type="text"
                                value={item.label || ''}
                                onChange={(e) => updateItemInProp(section.id, 'items', idx, 'label', e.target.value)}
                                className="w-full premium-input text-xs"
                              />
                            </div>
                            <div className="w-full md:w-32 space-y-1">
                              <label className="text-[10px] text-muted-foreground block font-bold">الرقم المستهدف</label>
                              <input
                                type="number"
                                value={item.value ?? 0}
                                onChange={(e) => updateItemInProp(section.id, 'items', idx, 'value', parseInt(e.target.value) || 0)}
                                className="w-full premium-input text-xs"
                              />
                            </div>
                            <div className="w-full md:w-20 space-y-1">
                              <label className="text-[10px] text-muted-foreground block font-bold">اللاحقة (مثال: +)</label>
                              <input
                                type="text"
                                value={item.suffix || ''}
                                onChange={(e) => updateItemInProp(section.id, 'items', idx, 'suffix', e.target.value)}
                                className="w-full premium-input text-xs text-center"
                              />
                            </div>
                            <button
                              onClick={() => deleteItemInProp(section.id, 'items', idx)}
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg self-end"
                              title="حذف الإحصائية"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* قسم المواد الدراسية الأكثر طلباً */}
                  {section.type === 'subjects' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">عنوان القسم</label>
                        <input
                          type="text"
                          value={section.props.title || ''}
                          onChange={(e) => updateProp(section.id, 'title', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground block">المواد الدراسية (مفصولة بفاصلة أو يتم كتابتها كشارات)</label>
                        <textarea
                          rows={3}
                          value={section.props.subjects?.join('، ') || ''}
                          onChange={(e) => {
                            const values = e.target.value.split(/[،,]\s*/).filter(v => v.trim() !== '');
                            updateProp(section.id, 'subjects', values);
                          }}
                          placeholder="رياضيات، فيزياء، كيمياء، عربي، إنجليزي"
                          className="w-full premium-input text-xs leading-relaxed resize-none"
                        />
                        <span className="text-[10px] text-muted-foreground block">استخدم الفاصلة العربية (،) أو الإنجليزية (,) للفصل بين المواد.</span>
                      </div>
                    </div>
                  )}

                  {/* قسم المميزات (Features) */}
                  {section.type === 'features' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-muted-foreground block">عنوان القسم</label>
                          <input
                            type="text"
                            value={section.props.title || ''}
                            onChange={(e) => updateProp(section.id, 'title', e.target.value)}
                            className="w-full premium-input text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-muted-foreground block">العنوان الفرعي للقسم</label>
                          <input
                            type="text"
                            value={section.props.subtitle || ''}
                            onChange={(e) => updateProp(section.id, 'subtitle', e.target.value)}
                            className="w-full premium-input text-xs"
                          />
                        </div>
                      </div>

                      <div className="border-t border-border pt-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-foreground">قائمة المميزات والبطاقات</h4>
                          <button
                            onClick={() => addItemInProp(section.id, 'items', { iconName: 'ShieldCheck', title: 'ميزة جديدة', desc: 'تفاصيل الميزة والوصف هنا.' })}
                            className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all"
                          >
                            <Plus className="w-3 h-3" /> إضافة ميزة
                          </button>
                        </div>

                        <div className="space-y-3">
                          {(section.props.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-3 p-3 bg-muted/20 border border-border rounded-xl relative">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-muted-foreground block font-bold">الأيقونة (Lucide)</label>
                                  <select
                                    value={item.iconName || 'ShieldCheck'}
                                    onChange={(e) => updateItemInProp(section.id, 'items', idx, 'iconName', e.target.value)}
                                    className="w-full premium-input text-xs"
                                  >
                                    {AVAILABLE_ICONS.map(ic => (
                                      <option key={ic} value={ic}>{ic}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                  <label className="text-[10px] text-muted-foreground block font-bold">عنوان الميزة</label>
                                  <input
                                    type="text"
                                    value={item.title || ''}
                                    onChange={(e) => updateItemInProp(section.id, 'items', idx, 'title', e.target.value)}
                                    className="w-full premium-input text-xs font-bold"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-muted-foreground block font-bold">تفاصيل ووصف الميزة</label>
                                <textarea
                                  rows={2}
                                  value={item.desc || ''}
                                  onChange={(e) => updateItemInProp(section.id, 'items', idx, 'desc', e.target.value)}
                                  className="w-full premium-input text-xs leading-relaxed resize-none"
                                />
                              </div>
                              <button
                                onClick={() => deleteItemInProp(section.id, 'items', idx)}
                                className="absolute top-2 left-2 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                                title="حذف الميزة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* قسم خطوات العمل (How It Works) */}
                  {section.type === 'how_it_works' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-muted-foreground block">عنوان القسم</label>
                          <input
                            type="text"
                            value={section.props.title || ''}
                            onChange={(e) => updateProp(section.id, 'title', e.target.value)}
                            className="w-full premium-input text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-muted-foreground block">العنوان الفرعي للقسم</label>
                          <input
                            type="text"
                            value={section.props.subtitle || ''}
                            onChange={(e) => updateProp(section.id, 'subtitle', e.target.value)}
                            className="w-full premium-input text-xs"
                          />
                        </div>
                      </div>

                      <div className="border-t border-border pt-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-foreground">قائمة خطوات الاستخدام</h4>
                          <button
                            onClick={() => addItemInProp(section.id, 'items', { num: '١', title: 'خطوة جديدة', desc: 'تفاصيل هذه الخطوة التعليمية.' })}
                            className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all"
                          >
                            <Plus className="w-3 h-3" /> إضافة خطوة
                          </button>
                        </div>

                        <div className="space-y-3">
                          {(section.props.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col md:flex-row items-start gap-3 p-3 bg-muted/20 border border-border rounded-xl relative">
                              <div className="w-full md:w-20 space-y-1">
                                <label className="text-[10px] text-muted-foreground block font-bold">الرقم/الرمز</label>
                                <input
                                  type="text"
                                  value={item.num || ''}
                                  onChange={(e) => updateItemInProp(section.id, 'items', idx, 'num', e.target.value)}
                                  className="w-full premium-input text-xs text-center"
                                />
                              </div>
                              <div className="flex-1 space-y-3 w-full">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-muted-foreground block font-bold">عنوان الخطوة</label>
                                  <input
                                    type="text"
                                    value={item.title || ''}
                                    onChange={(e) => updateItemInProp(section.id, 'items', idx, 'title', e.target.value)}
                                    className="w-full premium-input text-xs font-bold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-muted-foreground block font-bold">الوصف والتفاصيل</label>
                                  <textarea
                                    rows={2}
                                    value={item.desc || ''}
                                    onChange={(e) => updateItemInProp(section.id, 'items', idx, 'desc', e.target.value)}
                                    className="w-full premium-input text-xs leading-relaxed resize-none"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => deleteItemInProp(section.id, 'items', idx)}
                                className="absolute top-2 left-2 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                                title="حذف الخطوة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* قسم المعلمين المميزين */}
                  {section.type === 'featured_teachers' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-bold text-muted-foreground block">عنوان القسم</label>
                        <input
                          type="text"
                          value={section.props.title || ''}
                          onChange={(e) => updateProp(section.id, 'title', e.target.value)}
                          className="w-full premium-input text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">الحد الأقصى لعدد المعلمين لعرضهم</label>
                        <input
                          type="number"
                          value={section.props.limit ?? 6}
                          onChange={(e) => updateProp(section.id, 'limit', parseInt(e.target.value) || 6)}
                          className="w-full premium-input text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-3">
                        <label className="text-[11px] font-bold text-muted-foreground block">العنوان الفرعي للقسم</label>
                        <input
                          type="text"
                          value={section.props.subtitle || ''}
                          onChange={(e) => updateProp(section.id, 'subtitle', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* قسم آراء أولياء الأمور */}
                  {section.type === 'testimonials' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-muted-foreground block">عنوان القسم</label>
                          <input
                            type="text"
                            value={section.props.title || ''}
                            onChange={(e) => updateProp(section.id, 'title', e.target.value)}
                            className="w-full premium-input text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-muted-foreground block">العنوان الفرعي للقسم</label>
                          <input
                            type="text"
                            value={section.props.subtitle || ''}
                            onChange={(e) => updateProp(section.id, 'subtitle', e.target.value)}
                            className="w-full premium-input text-xs"
                          />
                        </div>
                      </div>

                      <div className="border-t border-border pt-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-foreground">قائمة الآراء والتقييمات</h4>
                          <button
                            onClick={() => addItemInProp(section.id, 'items', { text: 'المنصة ممتازة وسهلت عملية التعليم.', author: 'الاسم الكلي', city: 'رام الله' })}
                            className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-all"
                          >
                            <Plus className="w-3 h-3" /> إضافة رأي جديد
                          </button>
                        </div>

                        <div className="space-y-3">
                          {(section.props.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-3 p-3 bg-muted/20 border border-border rounded-xl relative">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] text-muted-foreground block font-bold">اسم ولي الأمر</label>
                                  <input
                                    type="text"
                                    value={item.author || ''}
                                    onChange={(e) => updateItemInProp(section.id, 'items', idx, 'author', e.target.value)}
                                    className="w-full premium-input text-xs font-bold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] text-muted-foreground block font-bold">المدينة السكنية</label>
                                  <input
                                    type="text"
                                    value={item.city || ''}
                                    onChange={(e) => updateItemInProp(section.id, 'items', idx, 'city', e.target.value)}
                                    className="w-full premium-input text-xs"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-muted-foreground block font-bold">الرأي / النص والتقييم</label>
                                <textarea
                                  rows={2}
                                  value={item.text || ''}
                                  onChange={(e) => updateItemInProp(section.id, 'items', idx, 'text', e.target.value)}
                                  className="w-full premium-input text-xs leading-relaxed resize-none"
                                />
                              </div>
                              <button
                                onClick={() => deleteItemInProp(section.id, 'items', idx)}
                                className="absolute top-2 left-2 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                                title="حذف الرأي"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* قسم الأسئلة الشائعة (FAQ) */}
                  {section.type === 'faq' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">عنوان القسم</label>
                        <input
                          type="text"
                          value={section.props.title || ''}
                          onChange={(e) => updateProp(section.id, 'title', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">العنوان الفرعي للقسم</label>
                        <input
                          type="text"
                          value={section.props.subtitle || ''}
                          onChange={(e) => updateProp(section.id, 'subtitle', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* قسم البانر الإرشادي للتسجيل السريع (CTA) */}
                  {section.type === 'cta' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-bold text-muted-foreground block">العنوان الرئيسي</label>
                        <input
                          type="text"
                          value={section.props.title || ''}
                          onChange={(e) => updateProp(section.id, 'title', e.target.value)}
                          className="w-full premium-input text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-bold text-muted-foreground block">الوصف والتفاصيل</label>
                        <textarea
                          rows={2}
                          value={section.props.subtitle || ''}
                          onChange={(e) => updateProp(section.id, 'subtitle', e.target.value)}
                          className="w-full premium-input text-xs leading-relaxed resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">نص زر الدعوة الرئيسي</label>
                        <input
                          type="text"
                          value={section.props.primaryBtnText || ''}
                          onChange={(e) => updateProp(section.id, 'primaryBtnText', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">رابط زر الدعوة الرئيسي</label>
                        <input
                          type="text"
                          value={section.props.primaryBtnLink || ''}
                          onChange={(e) => updateProp(section.id, 'primaryBtnLink', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">نص زر الدعوة الفرعي</label>
                        <input
                          type="text"
                          value={section.props.secondaryBtnText || ''}
                          onChange={(e) => updateProp(section.id, 'secondaryBtnText', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">رابط زر الدعوة الفرعي</label>
                        <input
                          type="text"
                          value={section.props.secondaryBtnLink || ''}
                          onChange={(e) => updateProp(section.id, 'secondaryBtnLink', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* قسم HTML المخصص */}
                  {section.type === 'custom_html' && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">عنوان القسم المخصص (للأرشفة فقط)</label>
                        <input
                          type="text"
                          value={section.props.title || ''}
                          onChange={(e) => updateProp(section.id, 'title', e.target.value)}
                          className="w-full premium-input text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground block">كود HTML مخصص (يدعم فئات Tailwind CSS)</label>
                        <textarea
                          rows={8}
                          value={section.props.html || ''}
                          onChange={(e) => updateProp(section.id, 'html', e.target.value)}
                          className="w-full premium-input text-xs font-mono leading-relaxed resize-y"
                          placeholder="<div class='p-6'>...</div>"
                        />
                        <span className="text-[10px] text-muted-foreground block">
                          تنبيه: الرجاء التأكد من كتابة كود HTML مغلق وصحيح لتفادي تشويه الصفحة العامة للموقع.
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })()
        ) : (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-xs text-muted-foreground">
            لا توجد أقسام نشطة. يرجى إضافة أقسام جديدة لتخطيط الصفحة.
          </div>
        )}
      </div>
    </div>
  );
}
