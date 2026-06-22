# 🏗️ معمارية مشروع EduNest (Architecture Overview)

يوثق هذا الملف الهيكل العام للمشروع التقني، والتقنيات والمكتبات المستخدمة، بالإضافة إلى كيفية تنظيم الملفات والمجلدات لتسهيل عملية التطوير والصيانة في المستقبل.

---

## 🛠️ التقنيات والمكتبات الأساسية (Tech Stack)

### 1. الإطار الأساسي (Core Framework)
- **[Next.js 16.2.6](https://nextjs.org/)**: إطار العمل الرئيسي باستخدام معمارية **App Router** الأحدث.
- **[React 19.2.4](https://react.dev/)**: مكتبة بناء واجهات المستخدم الأساسية.
- **[TypeScript](https://www.typescriptlang.org/)**: لغة البرمجة المستخدمة في جميع أنحاء المشروع لضمان الأمان البرمجي وتجنب أخطاء وقت التشغيل (Type-safety).

### 2. قاعدة البيانات والبيانات (Database & ORM)
- **[Prisma ORM (v7.8.0)](https://www.prisma.io/)**: أداة الربط مع قاعدة البيانات (Object-Relational Mapping)، مدعومة بـ `@prisma/adapter-pg`.
- **[PostgreSQL](https://www.postgresql.org/)**: محرك قاعدة البيانات الأساسي المستضاف على (Supabase).
- البحث المتقدم: يتم استخدام إضافة `pg_trgm` وفهارس الـ `GIN` لتحسين أداء عمليات البحث المطابقة للنصوص (ILIKE).

### 3. المصادقة والأمان (Authentication & Security)
- **[NextAuth.js (v4)](https://next-auth.js.org/)**: لإدارة تسجيل الدخول والجلسات (Sessions)، بتخصيص كامل في ملف `lib/auth.ts`.
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)**: لتشفير كلمات المرور في قاعدة البيانات.
- **[Zod](https://zod.dev/)**: للتحقق من صحة المدخلات (Schema Validation) سواء في النماذج (Forms) أو في الـ Server Actions.

### 4. واجهة المستخدم والتصميم (UI / Styling)
- **[Tailwind CSS (v4)](https://tailwindcss.com/)**: إطار عمل الـ CSS الأساسي للتصميم.
- **[Framer Motion](https://www.framer.com/motion/)**: لبرمجة الحركات الانسيابية (Animations) والمؤثرات البصرية للواجهة.
- **[Lucide React](https://lucide.dev/)**: مكتبة الأيقونات الموحدة في المنصة.
- **[Sonner](https://sonner.emilkowal.ski/)**: لإشعارات التنبيه السريعة (Toast notifications).
- **[Recharts](https://recharts.org/)**: لرسم المخططات البيانية (Charts) في لوحات التحكم.
- **clsx & tailwind-merge**: لدمج وتخصيص كلاسات Tailwind برمجياً.

### 5. تخزين الملفات (File Storage)
- **[Supabase Storage](https://supabase.com/docs/guides/storage)** (`@supabase/supabase-js`): لرفع وحفظ المرفقات، الصور الشخصية، وإيصالات الدفع. تتم معالجتها من خلال المسار الآمن `app/api/upload/route.ts`.

---

## 📁 هيكل المجلدات والملفات (Folder Structure)

يعتمد المشروع على فصل واضح للمسؤوليات (Separation of Concerns) و Clean Code:

```text
edunest/
├── app/                        # 🌐 مسارات الـ Next.js App Router
│   ├── (auth)/                 # مسارات المصادقة (تسجيل دخول، إنشاء حساب)
│   ├── api/                    # 🔌 مسارات الـ API (auth, upload)
│   ├── dashboard/              # 📊 لوحات التحكم الأساسية
│   │   ├── admin/              # لوحة الإدارة
│   │   ├── parent/             # لوحة ولي الأمر
│   │   └── teacher/            # لوحة المعلم
│   ├── teachers/               # صفحة عرض وتصفح المعلمين المتاحة للعامة
│   └── globals.css             # التصميمات العالمية وملف إعدادات Tailwind
│
├── components/                 # 🧩 مكونات واجهة المستخدم (React Components)
│   ├── home/                   # مكونات الصفحة الرئيسية
│   └── shared/                 # مكونات قابلة لإعادة الاستخدام (Cards, Modals, Forms)
│
├── lib/                        # 🧠 المنطق البرمجي والأدوات المشتركة
│   ├── actions/                # ⚡ Next.js Server Actions (عمليات الـ Backend)
│   │   ├── bookings/           # دوال الحجوزات (مقسمة لملفات: create, cancel...)
│   │   ├── tutoring-requests/  # دوال طلبات التدريس العامة
│   │   └── admin.ts            # إجراءات لوحة تحكم المشرف
│   ├── utils/                  # دوال مساعدة (التاريخ، الوقت، التوفر...)
│   ├── validations/            # Zod Schemas للتحقق من البيانات
│   ├── auth.ts                 # إعدادات NextAuth
│   ├── prisma.ts               # اتصال قاعدة بيانات Prisma
│   └── settings.ts             # جلب الإعدادات (نظام Caching عبر unstable_cache)
│
├── prisma/                     # 🗄️ إعدادات قاعدة البيانات
│   ├── schema.prisma           # مخطط قاعدة البيانات (DB Schema)
│   └── seed.ts                 # البيانات التأسيسية الأولية (Seeding)
│
└── public/                     # 🖼️ الملفات العامة (الصور الثابتة، الأيقونات)
```

---

## 🏛️ أنماط المعمارية المتبعة (Architectural Patterns)

1. **Server Actions First**: يتم استخدام ميزة Next.js Server Actions (`'use server'`) لمعظم عمليات القراءة والكتابة في قاعدة البيانات وتحديث الواجهة مباشرة باستخدام `revalidatePath` و `revalidateTag`، بدلاً من بناء REST APIs تقليدية.
2. **Barrel Exports**: لتقليل التعقيد في الملفات الضخمة، تم تقسيم ملفات الـ Server Actions (مثل `booking.ts` و `tutoring-request.ts`) إلى ملفات أصغر في مجلدات متخصصة، وتم استخدام ملفات Barrel لتصديرها.
3. **Optimized Data Fetching**: 
   - استخدام الـ **Server Components** الافتراضي في Next.js لجلب البيانات بشكل آمن من السيرفر.
   - استخدام `unstable_cache` من Next.js للحفاظ على استقرار أداء قاعدة البيانات عند استدعاء البيانات الثابتة (مثل الإعدادات العامة) وتقليل حمل قراءة البيانات (DB Reads).
4. **Race-Condition Safety**: استخدام `prisma.$transaction` مع Row-level locking (`FOR UPDATE`) لضمان عدم حدوث تعارض عند حجز المعلم في نفس اللحظة من قبل عدة أولياء أمور.
