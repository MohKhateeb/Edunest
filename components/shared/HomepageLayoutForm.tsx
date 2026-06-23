'use client';

import { useState } from 'react';
import { updateHomepageLayout } from '@/lib/actions/admin';
import { 
  Save, Loader2, AlertCircle, ArrowUp, ArrowDown, Trash2, 
  Plus, Eye, EyeOff, Settings, Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Section, SectionType, SECTION_TYPE_LABELS, DEFAULT_LAYOUT } from '@/types/homepage-layout';
import {
  HeroSectionForm,
  StatsSectionForm,
  SubjectsSectionForm,
  FeaturesSectionForm,
  HowItWorksSectionForm,
  FeaturedTeachersSectionForm,
  TestimonialsSectionForm,
  FaqSectionForm,
  CtaSectionForm,
  CustomHtmlSectionForm
} from './homepage-forms/SectionForms';

export default function HomepageLayoutForm({ initialLayoutJson }: { initialLayoutJson: string | null }) {
  const router = useRouter();
  
  const getInitialLayout = (): Section[] => {
    if (!initialLayoutJson) return DEFAULT_LAYOUT;
    try {
      const parsed = JSON.parse(initialLayoutJson) as Section[];
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

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSections(updated);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSections(updated);
  };

  const deleteSection = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك بحذف هذا القسم من الصفحة الرئيسية؟')) {
      const updated = sections.filter((s) => s.id !== id);
      setSections(updated);
      if (activeTab === id) {
        setActiveTab(updated[0]?.id || null);
      }
    }
  };

  const toggleEnabled = (id: string) => {
    const updated = sections.map((s) => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setSections(updated);
  };

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

  const updateItemInProp = (sectionId: string, propKey: string, itemIndex: number, field: string, value: any) => {
    const updated = sections.map((s) => {
      if (s.id === sectionId) {
        const currentItems = [...(s.props[propKey] || [])];
        if (currentItems[itemIndex]) {
          currentItems[itemIndex] = {
            ...currentItems[itemIndex],
            [field]: value
          };
        }
        return { ...s, props: { ...s.props, [propKey]: currentItems } };
      }
      return s;
    });
    setSections(updated);
  };

  const deleteItemInProp = (sectionId: string, propKey: string, itemIndex: number) => {
    const updated = sections.map((s) => {
      if (s.id === sectionId) {
        const currentItems = [...(s.props[propKey] || [])];
        currentItems.splice(itemIndex, 1);
        return { ...s, props: { ...s.props, [propKey]: currentItems } };
      }
      return s;
    });
    setSections(updated);
  };

  const addItemInProp = (sectionId: string, propKey: string, defaultItem: any) => {
    const updated = sections.map((s) => {
      if (s.id === sectionId) {
        const currentItems = [...(s.props[propKey] || [])];
        currentItems.push(defaultItem);
        return { ...s, props: { ...s.props, [propKey]: currentItems } };
      }
      return s;
    });
    setSections(updated);
  };

  const addNewSection = () => {
    const uniqueId = `${newSectionType}_${Date.now()}`;
    let defaultProps: Record<string, any> = {};

    switch (newSectionType) {
      case 'custom_html': defaultProps = { title: 'قسم مخصص جديد', html: '<div class="py-12 text-center bg-gray-50 border rounded-2xl"> محتوى مخصص </div>' }; break;
      case 'hero': defaultProps = { headline: 'عنوان البانر الرئيسي', subheadline: 'وصف قصير للبانر', primaryBtnText: 'رابط رئيسي', primaryBtnLink: '#', secondaryBtnText: 'رابط فرعي', secondaryBtnLink: '#' }; break;
      case 'stats': defaultProps = { items: [{ label: 'عنصر إحصائي', value: 100, suffix: '+' }] }; break;
      case 'subjects': defaultProps = { title: 'المواد الدراسية', subjects: ['رياضيات', 'عربي'] }; break;
      case 'features': defaultProps = { title: 'ميزاتنا', subtitle: 'وصف المميزات', items: [{ iconName: 'ShieldCheck', title: 'ميزة جديدة', desc: 'تفاصيل الميزة' }] }; break;
      case 'how_it_works': defaultProps = { title: 'طريقة العمل', subtitle: 'شرح بسيط', items: [{ num: '١', title: 'خطوة أولى', desc: 'تفاصيل الخطوة' }] }; break;
      case 'featured_teachers': defaultProps = { title: 'معلمون مميزون', subtitle: 'الأعلى تقييماً', limit: 6 }; break;
      case 'testimonials': defaultProps = { title: 'تجارب مستخدمين', subtitle: 'ماذا قالوا عنا', items: [{ text: 'محتوى التقييم', author: 'الاسم', city: 'المدينة' }] }; break;
      case 'faq': defaultProps = { title: 'الأسئلة الشائعة', subtitle: 'استفسارات شائعة' }; break;
      case 'cta': defaultProps = { title: 'انضم إلينا الآن', subtitle: 'سجل فوراً بالمنصة', primaryBtnText: 'سجل كطالب', primaryBtnLink: '/register', secondaryBtnText: 'سجل كمعلم', secondaryBtnLink: '/register' }; break;
    }

    const newSec: Section = { id: uniqueId, type: newSectionType, enabled: true, props: defaultProps };
    setSections([...sections, newSec]);
    setActiveTab(uniqueId);
    setSuccessMsg('تمت إضافة القسم بنجاح.');
  };

  const handleSave = async () => {
    setLoading(true); setErrorMsg(null); setSuccessMsg(null);
    const res = await updateHomepageLayout(JSON.stringify(sections));
    setLoading(false);
    if (res.success) {
      setSuccessMsg('تم حفظ وتحديث تخطيط ومحتوى الصفحة الرئيسية بنجاح ✓');
      router.refresh();
    } else {
      setErrorMsg(res.error);
    }
  };

  const renderSectionForm = (section: Section) => {
    const props = { section, updateProp, updateItemInProp, addItemInProp, deleteItemInProp };
    switch (section.type) {
      case 'hero': return <HeroSectionForm {...props} />;
      case 'stats': return <StatsSectionForm {...props} />;
      case 'subjects': return <SubjectsSectionForm {...props} />;
      case 'features': return <FeaturesSectionForm {...props} />;
      case 'how_it_works': return <HowItWorksSectionForm {...props} />;
      case 'featured_teachers': return <FeaturedTeachersSectionForm {...props} />;
      case 'testimonials': return <TestimonialsSectionForm {...props} />;
      case 'faq': return <FaqSectionForm {...props} />;
      case 'cta': return <CtaSectionForm {...props} />;
      case 'custom_html': return <CustomHtmlSectionForm {...props} />;
      default: return <div>نموذج غير معروف.</div>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm h-fit">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-foreground">
            <Settings className="w-4 h-4 text-primary" /> أقسام الصفحة الرئيسية
          </h3>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
            {sections.length} أقسام
          </span>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {sections.map((section, index) => {
            const isActive = activeTab === section.id;
            const labelInfo = SECTION_TYPE_LABELS[section.type];

            return (
              <div 
                key={section.id} 
                className={`p-3 rounded-lg border text-xs flex flex-col gap-2 transition-all cursor-pointer ${
                  isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/20 hover:bg-muted/40'
                }`}
                onClick={() => setActiveTab(section.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleEnabled(section.id); }}
                      className={`p-1 rounded-md transition-colors ${
                        section.enabled ? 'text-emerald-600 bg-emerald-50' : 'text-muted-foreground bg-muted'
                      }`}
                    >
                      {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <span className="font-bold text-foreground truncate block">
                      {labelInfo?.label || section.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-muted">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveDown(index)} disabled={index === sections.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-muted">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteSection(section.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {!section.enabled && (
                  <span className="text-[10px] text-muted-foreground italic">(مخفي من الصفحة الرئيسية)</span>
                )}
              </div>
            );
          })}
        </div>

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
            <button onClick={addNewSection} className="bg-primary/10 text-primary p-2.5 rounded-lg">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</> : <><Save className="w-4 h-4" /> حفظ التخطيط</>}
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-4 py-3 rounded-xl border animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" /><span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-4 py-3 rounded-xl border animate-fade-in">
            <Check className="h-4 w-4 shrink-0" /><span>{successMsg}</span>
          </div>
        )}

        {activeTab ? (() => {
            const section = sections.find((s) => s.id === activeTab);
            if (!section) return <div className="bg-card border rounded-xl p-8 text-center text-xs">القسم غير موجود.</div>;
            const labelInfo = SECTION_TYPE_LABELS[section.type];

            return (
              <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm animate-fade-in">
                <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-extrabold text-base text-foreground flex items-center gap-2">
                      <span>تعديل محتوى: {labelInfo?.label || section.type}</span>
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono">
                        ID: {section.id}
                      </span>
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-1">{labelInfo?.desc}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {renderSectionForm(section)}
                </div>
              </div>
            );
          })() : (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-xs text-muted-foreground">
            لا توجد أقسام نشطة. يرجى إضافة أقسام جديدة لتخطيط الصفحة.
          </div>
        )}
      </div>
    </div>
  );
}
