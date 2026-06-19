'use client';

import { useState } from 'react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { 
  Search, 
  BookOpen, 
  User, 
  GraduationCap, 
  Shield, 
  Video, 
  HelpCircle, 
  FileDown
} from 'lucide-react';

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PARENT' | 'TEACHER' | 'ADMIN' | 'FAQ'>('GENERAL');
  const [searchQuery, setSearchQuery] = useState('');

  // الأسئلة الشائعة
  const faqs = [
    {
      category: 'GENERAL',
      question: 'ما هي شروط إلغاء الحصص واسترداد الرسوم؟',
      answer: 'يمكن لولي الأمر إلغاء الحصة واسترداد الرسوم تلقائياً قبل 24 ساعة من موعد الحصة. في حال الإلغاء بعد ذلك، يتم خصم كامل المبلغ ويذهب للمعلم كتعويض عن حجز وقته.'
    },
    {
      category: 'PARENT',
      question: 'كيف يمكنني إضافة ابن جديد لحسابي؟',
      answer: 'انتقل إلى لوحة تحكم ولي الأمر ⬅️ الطلاب ⬅️ اضغط على "إضافة طالب جديد"، وقم بتعبئة اسمه وصفه الدراسي ومدرسته. هذا يساعدنا على تخصيص الحصص والمناهج.'
    },
    {
      category: 'PARENT',
      question: 'كيف أقوم بتأكيد الدفع للمعلم بعد حجز الحصة؟',
      answer: 'بعد حجز الحصة من جدول المعلم المتاح، انتقل إلى "حصصي"، ستجد حالة الحجز "بانتظار الدفع". اضغط على "تفاصيل الدفع" وقم برفع صورة إيصال التحويل البنكي أو إثبات الدفع، وسيقوم الأدمن بتأكيدها فوراً.'
    },
    {
      category: 'TEACHER',
      question: 'كيف أحدد أوقات عملي في الجدول؟',
      answer: 'انتقل إلى لوحة المعلم ⬅️ جدول التوفر. حدد الأيام وساعات العمل المتكررة التي تفضلها أسبوعياً، ثم اضغط على حفظ. لن يتمكن الأهالي من حجز حصص معك إلا في هذه الأوقات المحددة.'
    },
    {
      category: 'TEACHER',
      question: 'لماذا يجب رفع تقرير الجلسة بعد انتهاء الحصة؟',
      answer: 'رفع تقرير الجلسة (المواضيع المغطاة، تقييم الطالب، والواجبات) هو شرط أساسي لاعتماد الحصة كمكتملة في محرك تسوية الأرباح وصرف مستحقاتك المالية.'
    },
    {
      category: 'ADMIN',
      question: 'كيف تتم تسوية أرباح المعلمين ومنع الدفع المزدوج؟',
      answer: 'يوفر النظام محرك تسويات مالي (Payouts Engine) يقوم بربط كل حجز مكتمل برقم تسوية فريد ومستقل. بمجرد إدراج الحصة في تسوية ما وتأكيد دفعها، يتم إغلاقها ولا يمكن إدراجها في أي تسوية أخرى مطلقاً.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === 'FAQ' || faq.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <Header />
      
      {/* 🌟 Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-primary/10 via-background to-background py-16 border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <span className="inline-block text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
            مركز مساعدة إيدونِست التفاعلي
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            كيف يمكننا مساعدتك اليوم؟
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            تصفح دليل الاستخدام الشامل للمنصة، وتعلم كيفية إدارة حسابك ودروسك التعليمية بسهولة تامة وبحسب دورك في المنصة.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-lg mx-auto pt-2">
            <Search className="absolute end-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
            <input 
              type="text" 
              placeholder="ابحث عن موضوع، سؤال شائك، أو دليل..."
              className="w-full premium-input ps-4 pe-11 py-3 text-sm rounded-xl shadow-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 📑 Main Content Tabs */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground px-3 uppercase tracking-wider">
            أدلة الاستخدام والأدوار
          </h3>
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('GENERAL')}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'GENERAL'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border/40 hover:bg-muted text-foreground'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              1. القواعد العامة للمنصة
            </button>
            
            <button
              onClick={() => setActiveTab('PARENT')}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'PARENT'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border/40 hover:bg-muted text-foreground'
              }`}
            >
              <User className="h-4 w-4" />
              2. دليل استخدام أولياء الأمور
            </button>

            <button
              onClick={() => setActiveTab('TEACHER')}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'TEACHER'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border/40 hover:bg-muted text-foreground'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              3. دليل استخدام المعلمين
            </button>

            <button
              onClick={() => setActiveTab('ADMIN')}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'ADMIN'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border/40 hover:bg-muted text-foreground'
              }`}
            >
              <Shield className="h-4 w-4" />
              4. دليل إدارة المنصة (أدمن)
            </button>

            <button
              onClick={() => setActiveTab('FAQ')}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'FAQ'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border/40 hover:bg-muted text-foreground'
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              5. الأسئلة الشائعة الفورية
            </button>
          </nav>

          {/* Download Manual Card */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 mt-6 shadow-xs">
            <h4 className="font-extrabold text-xs">تحميل النسخة المطبوعة</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              يمكنك تحميل دليل الاستخدام كملف مستند مستقل لفتحه على جهازك أو طباعته كـ PDF/Word.
            </p>
            <a 
              href="/user_manual.html" 
              target="_blank" 
              className="flex items-center justify-center gap-2 w-full py-2 bg-muted text-xs font-bold rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-center"
            >
              <FileDown className="h-4 w-4" />
              تصفح / طباعة المستند
            </a>
          </div>
        </aside>

        {/* Content Viewer Panel */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Tab 1: General Platform Rules */}
          {activeTab === 'GENERAL' && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-border pb-3">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  شروط وقواعد عمل منصة إيدونِست
                </h2>
                <p className="text-xs text-muted-foreground mt-1">القواعد العامة الحاكمة لماليات وجدولة المنصة.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
                  <span className="font-bold text-xs text-primary block">⏳ سياسة إلغاء الحجز</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    يتاح إلغاء الحصة مجاناً قبل 24 ساعة من بدئها. الإلغاء بعد ذلك يخصم قيمة الدرس بالكامل تعويضاً للمعلم.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
                  <span className="font-bold text-xs text-primary block">⭐ الحصص التجريبية المجانية</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    تمنح المنصة حصة تجريبية واحدة مجانية مدتها 30 دقيقة لكل ولي أمر لتجربة جودة التعليم دون قيود مسبقة.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
                  <span className="font-bold text-xs text-primary block">💸 عمولة المنصة</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    يخصم النظام عمولة تشغيل افتراضية تبلغ %15 من قيمة الدرس الخصوصي لضمان صيانة واستمرار الخدمات.
                  </p>
                </div>
                <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
                  <span className="font-bold text-xs text-primary block">⏱️ الحد الأدنى للجدولة</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    لا يمكن حجز موعد مع أي معلم قبل أقل من ساعتين (2h) من موعد بدء الحصة الفعلي للتأكد من استعداد الطرفين.
                  </p>
                </div>
              </div>

              {/* Jitsi Meet Section */}
              <div className="bg-primary/5 border border-primary/10 p-5 rounded-xl space-y-3">
                <h4 className="font-extrabold text-sm flex items-center gap-2 text-primary">
                  <Video className="h-5 w-5" />
                  نظام غرف الفيديوهات وأمن الفصول الافتراضية
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  يعتمد النظام على أداة Jitsi Meet لبدء الحصص. يتم إنشاء رابط الغرفة عشوائياً وتأمينه. يفتح الرابط تلقائياً قبل 5 دقائق فقط من موعد الجلسة المجدول، ويغلق ويتم إنهاؤه فور فوات وقت الحصة الإجمالي.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Parent Guide */}
          {activeTab === 'PARENT' && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-border pb-3">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  دليل ولي الأمر (حجز ومتابعة الدروس)
                </h2>
                <p className="text-xs text-muted-foreground mt-1">خطوات حجز الحصص لأبنائك خطوة بخطوة.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">١</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs">إضافة الأبناء للوحة التحكم</h4>
                    <p className="text-xs text-muted-foreground">انتقل إلى قسم &quot;الطلاب&quot; في لوحة تحكمك، وأضف أسماء أبنائك وصفوفهم (من الصف 1 إلى 12).</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">٢</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs">البحث عن المعلم واختيار الوقت المتاح</h4>
                    <p className="text-xs text-muted-foreground">تصفح ملفات المعلمين، واختر موعداً متاحاً باللون الأخضر يناسب جدول ابنك الدراسي.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">٣</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs">رفع إيصال تحويل الرسوم يدوياً</h4>
                    <p className="text-xs text-muted-foreground">بعد إرسال الطلب، قم بتحويل الرسوم وارفع صورة الإيصال ليقوم الأدمن بالمصادقة عليها وتأكيد حجزك.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">٤</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs">حضور الحصة بالفيديو وتقييم المعلم</h4>
                    <p className="text-xs text-muted-foreground">ادخل للغرفة في موعدها، وبعد انتهاء الجلسة يمكنك قراءة تقرير المعلم حول مستوى ابنك وكتابة تقييمك.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Teacher Guide */}
          {activeTab === 'TEACHER' && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-border pb-3">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  دليل المعلم (إدارة الجدول والأرباح)
                </h2>
                <p className="text-xs text-muted-foreground mt-1">كيف تدير حصصك ومستحقاتك داخل النظام.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">١</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs">إدخال جدول التوفر الأسبوعي (Availability)</h4>
                    <p className="text-xs text-muted-foreground">أدخل أيام وساعات عملك المتكررة في لوحة التحكم. لن يتمكن أحد من حجز موعد معك خارج هذا النطاق.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">٢</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs">قبول ورفض الطلبات الفورية</h4>
                    <p className="text-xs text-muted-foreground">يجب مراجعة طلبات الحجز القادمة من الأهالي وتأكيد القبول أو الرفض ليتمكن ولي الأمر من الدفع.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-7 w-7 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">٣</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs">حضور الحصة ورفع التقرير (إلزامي)</h4>
                    <p className="text-xs text-muted-foreground">بعد إكمال الحصة، اكتب تقرير الجلسة (الموضوع والواجب). بدون هذا التقرير، لن تدخل الحصة في كشف أرباحك.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Admin Guide */}
          {activeTab === 'ADMIN' && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-border pb-3">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  دليل المدير العام (إدارة لوحة التحكم)
                </h2>
                <p className="text-xs text-muted-foreground mt-1">كيفية التحقق من البيانات والتحكم بالنظام.</p>
              </div>

              <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
                <div className="p-3 bg-muted/40 rounded-lg">
                  <strong className="text-foreground font-semibold block mb-0.5">1. تأكيد المدفوعات (Payment Queue)</strong>
                  مراجعة إيصالات الدفع التي يرفعها أولياء الأمور وتأكيد الحجز ليصبح مؤكداً وتنشيط رابط الفيديو.
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <strong className="text-foreground font-semibold block mb-0.5">2. توثيق المعلمين (Verification levels)</strong>
                  مراجعة شهادات المعلمين وتصنيف مستوياتهم (برونزي، فضي، ذهبي) لجلب المصداقية للمنصة.
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <strong className="text-foreground font-semibold block mb-0.5">3. تسوية المستحقات (Payouts Engine)</strong>
                  محرك تسوية الأرباح التلقائي لمنع الدفع المزدوج للمعلم (الحصة تدخل في تسوية مالية واحدة فقط وغير قابلة للتكرار).
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: FAQ & Search Results */}
          {(activeTab === 'FAQ' || searchQuery !== '') && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-border pb-3">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  الأسئلة الشائعة والبحث الفوري
                </h2>
                <p className="text-xs text-muted-foreground mt-1">ابحث وتصفح الإجابات الشائعة لحل المشكلات.</p>
              </div>

              <div className="space-y-4 divide-y divide-border/60">
                {filteredFaqs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-10 text-center">لا توجد نتائج مطابقة لبحثك.</p>
                ) : (
                  filteredFaqs.map((faq, index) => (
                    <div key={index} className={`pt-4 ${index === 0 ? 'pt-0' : ''} space-y-1.5`}>
                      <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                        {faq.question}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed pr-3">{faq.answer}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </section>
      </main>

      <Footer />
    </div>
  );
}
