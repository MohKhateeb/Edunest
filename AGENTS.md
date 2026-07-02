<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Clean Code & Tidy-First Rule
**CRITICAL:** Any AI agent working on this repository must abide by the "Tidy-First" principle:
1. **Zero Dead Code:** Never leave behind unused variables, functions, components, or imports. Clean them up immediately.
2. **DRY Principle:** Before writing new UI logic or components, check for existing reusable components. Do not duplicate forms or layouts.
3. **Keep it Small:** Break down files larger than 400 lines into smaller subcomponents.

# AGENTS.md — قواعد ملزمة لمشروع EduNest

> هذا الملف يُقرأ تلقائياً من قبل أي وكيل (Agent) قبل بدء أي مهمة في هذا المستودع.
> الالتزام بكل بند هنا **إلزامي وصامت** — لا حاجة لذكره في البرومبت، ولا لتأكيده،
> ولا لانتظار موافقة عليه. أي تعديل أو إضافة على الكود يجب أن يمر عبر هذه القواعد
> تلقائياً وبدون استثناء، ما لم يُطلب صراحة خلاف ذلك من المطوّر في نفس المحادثة.
>
> إذا تعارض أي طلب في محادثة معينة مع قاعدة هنا، والوكيل غير متأكد إن كان هذا
> استثناءً مقصوداً أم خطأً غير مقصود من المستخدم: **يجب التوقف والسؤال، لا الافتراض.**

---

## 0. مبدأ عام: التوقف عند الشك

- إن اكتشف الوكيل أثناء العمل أن تعديلاً مطلوباً سيُجبره على مخالفة أحد البنود
  أدناه، يجب أن يتوقف ويشرح التعارض بدل تجاوز القاعدة بصمت.
- "الحل الأسرع" ليس مبرراً لمخالفة أي بند هنا. لا اختصارات.
- كل قاعدة هنا نتجت من خطأ حقيقي حدث فعلياً في هذا المشروع وتم اكتشافه لاحقاً
  بصعوبة — الالتزام بها ليس شكلياً، بل وقائي.

---

## 1. قاعدة قاعدة البيانات: `db push` فقط

- هذا المشروع **لا يستخدم** `prisma migrate` إطلاقاً. لا يوجد سجل Migrations
  حقيقي في المستودع.
- أي تعديل على `prisma/schema.prisma` يجب أن يُختم بتشغيل:
  ```
  npx prisma db push
  ```
- **ممنوع منعاً باتاً** تشغيل `prisma migrate dev` أو `prisma migrate reset` —
  الأمر الثاني تحديداً قد يحذف قاعدة البيانات بالكامل.
- بعد أي `db push`، يجب التحقق عبر `npx prisma db pull --print` أن قاعدة
  البيانات الحية فعلاً متزامنة مع الـ schema المحلي — لا يكفي افتراض النجاح.
- التغييرات على الـ Schema يجب أن تكون **إضافية دائماً** (Additive) عند الإمكان:
  إضافة قيم Enum جديدة أو أعمدة Nullable جديدة، لا حذف أو تعديل حقول قائمة
  دون تنسيق صريح مع المطوّر.

---

## 2. قاعدة Git: لا عمل بدون Commit

- كل خطوة منطقية مكتملة (ملف واحد، أو مجموعة ملفات مترابطة لمهمة واحدة)
  يجب أن تُختم فوراً بـ:
  ```
  git add -A && git commit -m "<رسالة واضحة بالإنجليزية أو العربية>"
  ```
- **لا تنتظر نهاية المهمة الكبيرة لعمل commit واحد ضخم.** العمل غير المحفوظ
  ضاع فعلياً في هذا المشروع أكثر من مرة بسبب تبديل الجلسات/الفروع.
- قبل بدء أي مهمة جديدة: تحقق من `git status` و `git branch --show-current`.
  إن وُجدت تعديلات غير محفوظة من جلسة سابقة، احفظها أولاً (commit منفصل بعنوان
  `wip: ...`) قبل المتابعة — لا تتجاهلها ولا تكتب فوقها.
- لا تنشئ فرعاً جديداً دون داعٍ واضح. إن كان العمل امتداداً لمهمة سابقة، تحقق
  من الفرع الصحيح واستمر عليه.

---

## 3. TypeScript صارم — بدون `any`

- ممنوع استخدام `any` في أي ملف داخل `lib/` أو `app/`، بلا استثناء.
- عند الحاجة لنوع من Prisma، استخدم الأنواع المولّدة تلقائياً:
  `Prisma.<Model>WhereInput`, `Prisma.<Model>UpdateInput`,
  `Prisma.<Model>GetPayload<{...}>`، إلخ.
- إن أدى إزالة `any` لكشف خطأ حقيقي في التوافق بين الكود والـ schema
  (كما حدث سابقاً في هذا المشروع) — هذا يعني أن `any` كان يخفي خطأً حقيقياً،
  ويجب إصلاح الجذر لا التفافه.
- الاستثناء الوحيد المسموح به حالياً: `lib/actions/details.ts` (استثناء
  موثّق ومعروف بانتظار ترحيله لاحقاً لنمط Repository — لا تُصلحه ضمن مهام
  أخرى ما لم يُطلب ذلك تحديداً).

---

## 4. نمط Repository إلزامي

- أي Server Action يحتاج بيانات من قاعدة البيانات يجب أن يستدعي دالة من
  `lib/repositories/`، لا أن يستورد `prisma` مباشرة.
- الملف المرجعي القياسي لهذا النمط: `lib/actions/disputes.ts` +
  `lib/repositories/disputeRepository.ts`.
- عند إنشاء Repository جديد: دوال واضحة الاسم (`findByIdWithFullDetails`,
  `createWithInitialMessage`, ...)، أنواع إرجاع صريحة عبر
  `Prisma.<Model>GetPayload`، ومنطق الـ Transaction (`$transaction`) يعيش
  داخل الـ Repository لا داخل الـ Action.

---

## 5. صلاحيات مركزية (Authorization)

- أي تحقق من ملكية بيانات (parent يملك هذا الحجز؟ teacher مرتبط بهذا النزاع؟)
  يجب أن يمر عبر دالة Guard من `lib/auth/authorization.ts` — لا مقارنات
  يدوية inline داخل الـ Actions.
- كل Guard دالة نقية (Pure Function): بدون async، بدون Prisma، بدون آثار
  جانبية، تُرجع `{ authorized: true } | { authorized: false; error: string }`.
- عند إضافة كيان جديد يحتاج تحققاً من الصلاحية، أضف Guard جديدة في نفس
  الملف بدل تكرار المنطق محلياً.

---

## 6. آلة حالة الحجز (Booking State Machine)

- الحالات الحالية:
  `PENDING` (قديمة/تجريبية فقط) → `PENDING_APPROVAL` → `AWAITING_PAYMENT`
  → `CONFIRMED` → `COMPLETED`
  مع مخارج جانبية: `REJECTED`, `CANCELLED`, `EXPIRED`.
- **كل** انتقال حالة (`status: BookingStatus.X`) داخل أي Server Action يجب
  أن يُسبَق بفحص:
  ```typescript
  if (!isValidTransition(booking.status, BookingStatus.X)) {
    return { success: false, error: getTransitionError(booking.status, BookingStatus.X) };
  }
  ```
  من `lib/utils/booking-state.ts`. **لا مقارنات نصية يدوية بديلة عن هذا الفحص**
  (تم اكتشاف انتهاك حقيقي لهذه القاعدة في `pay.ts` سابقاً — كلفنا جولة تدقيق
  كاملة لإيجاده).
- الاستثناء الوحيد المقبول: إدخال أولي جديد في قاعدة البيانات (`create`)،
  حيث لا "انتقال" من حالة سابقة أصلاً. وكذلك تجاوزات إدارية موثّقة بوضوح
  في تعليق كود (مثل تسوية `AdminEscrow`).
- **حماية الحجز المزدوج (Double-Booking):** أي استعلام يتحقق من تعارض الأوقات
  أو "الحجوزات الفعّالة" (Active/Blocking bookings) يجب أن يشمل الحالات
  الأربع معاً: `PENDING`, `PENDING_APPROVAL`, `AWAITING_PAYMENT`, `CONFIRMED`.
  نسيان إحداها = ثغرة حجز مزدوج حقيقية حدثت سابقاً في هذا المشروع.

---

## 7. الإعدادات الديناميكية بدل القيم الثابتة

- أي قيمة زمنية أو رقمية قد يحتاج مدير النظام تغييرها لاحقاً (مهلة الدفع،
  حدود زمنية، نسب عمولة...) يجب أن تُقرأ من `SystemSettings` عبر
  `getSettingNumber("KEY", fallbackDefault)` من `lib/settings.ts` —
  **لا Hardcoding مطلقاً**، ولا حتى كـ "ثابت مسمّى" في `lib/config/constants.ts`
  إن كانت القيمة تخص سياسة عمل (Business Policy) قابلة للتغيير.
- عند إضافة إعداد جديد: أضفه في `prisma/seed.ts` بقيمة افتراضية موثّقة
  (description بالعربية)، وأضفه لواجهة `AdminSettingsForm.tsx` بنفس نمط
  الحقول الموجودة.

---

## 8. اتساق الواجهة (UI Consistency)

- ألوان وتسميات حالة الحجز تأتي **حصراً** من `BOOKING_STATUS_AR` و
  `BOOKING_STATUS_STYLES` في `lib/translations.ts`. ممنوع تكرار شروط ألوان
  Tailwind يدوياً (`status === "X" && "bg-..."`) في أي مكون — استورد القاموس
  مباشرة:
  ```tsx
  className={cn(baseClasses, BOOKING_STATUS_STYLES[status] ?? BOOKING_STATUS_STYLES.PENDING)}
  ```
- الاستثناء الوحيد: نقاط/عناصر صغيرة (Dots) تحتاج لوناً مصمتاً واحداً بدل
  شارة كاملة (bg-50/text-700/border) — في هذه الحالة فقط يُسمح باختيار لون
  يدوي، لكنه **يجب أن يطابق نفس عائلة اللون المعتمدة** (مثال:
  `AWAITING_PAYMENT` = برتقالي في كل مكان، `PENDING_APPROVAL` = كهرماني،
  `CONFIRMED` = زمردي، `COMPLETED` = أزرق، `REJECTED` = وردي،
  `CANCELLED`/`EXPIRED` = رمادي محايد — وليس أحمر، فهي حالات محايدة لا أخطاء).
- **ممنوع استخدام `window.prompt` أو `window.confirm`** في أي مكون. استخدم
  `components/shared/ConfirmDialog.tsx` الموجود مسبقاً (title, description,
  requireReason, onConfirm, onCancel, isLoading).
- عناصر العد التنازلي المرتبطة بالدفع: `PaymentCountdown.tsx` (تفاعلي،
  يحتوي زر دفع + Modal، لولي الأمر) منفصل عن
  `PaymentCountdownReadOnly.tsx` (عرض فقط، للمعلم/الإدارة) — لا تُنشئ نسخة
  ثالثة، ولا تدمجهما.

---

## 9. الأداء: N+1 والـ Pagination

- أي استعلام `findMany` يُعرض كقائمة/جدول ويُحتمل نموّه فوق ~50 صف
  (خصوصاً شاشات الإدارة) يجب أن يستخدم Pagination بنمط Cursor:
  `take: PAGE_SIZE + 1`, `cursor + skip: 1`, إرجاع `{ items, nextCursor }`.
  لا Offset-based pagination.
- ممنوع استدعاء Prisma داخل حلقة (`for`/`map`/`forEach`) — إما `include`
  مناسب في استعلام واحد، أو `where: { id: { in: [...] } }` دفعة واحدة.
- عند الشك في تكرار استعلام لنفس البيانات ضمن نفس الدالة، ادمجهما عبر
  `include` بدل استعلامين منفصلين.

---

## 10. عند إضافة أي حالة/enum جديد مستقبلاً

قائمة تحقق إلزامية عند إضافة أي قيمة جديدة لأي enum معروض في الواجهة
(مثل حالة حجز جديدة مستقبلاً):

1. أضفها لـ `BOOKING_STATUS_AR` / `BOOKING_STATUS_STYLES` (أو ما يعادلها).
2. حدّث `isValidTransition` بالانتقالات المسموحة الجديدة.
3. تحقق من كل فلتر "حالات فعّالة/محظورة" في الـ Repositories.
4. افحص كل شاشة عرض (parent, teacher, admin, modals, calendars, financial
   pages, notification text) — لا تفترض أن شاشة واحدة تمثل الجميع.
5. `db push` + تحقق `db pull --print` + `git commit` في كل خطوة.

---

## ملاحظة ختامية

هذا الملف حي — إن اكتشف الوكيل قاعدة جديدة ضرورية أثناء العمل (كما حدث مراراً
في هذا المشروع)، يُقترح على المطوّر تحديث هذا الملف بدل الاكتفاء بإصلاح
الحالة الفردية فقط.

---

## 11. i18n & Currency Safety Rules

- **Rule 10:** All i18n strings must use next-intl `t('key')` — never hardcode user-facing text in components.
- **Rule 11:** All monetary values must display via `formatCurrency()` from `lib/utils/currency.ts` — never format prices inline.

---

## ROLLBACK PLAN

- **Full rollback:** `git checkout main` (feature branch preserved for debugging)
- **Partial rollback:** set `NEXT_PUBLIC_I18N_ENABLED=false` in `.env.local` (bypasses all routing changes)
