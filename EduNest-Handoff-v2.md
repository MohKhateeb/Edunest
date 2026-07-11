# EduNest — وثيقة التسليم (نسخة ٢) — العملة والترجمة الشاملة
> آخر تحديث: يوليو 2026 | الفرع: `feature/i18n-multicurrency`
> هذه الوثيقة تُكمل وتُحدِّث `EduNest-Handoff.md` الأصلية بعد إنجاز مسار كامل من العمل عبر عدة جلسات طويلة.

---

## 0. كيفية استخدام هذه الوثيقة

ضعها في **Project Knowledge** على claude.ai. عند بدء محادثة جديدة داخل نفس الـ Project، ابدأ بـ:

> "اقرأ EduNest-Handoff-v2.md. أكمل من حيث توقفنا."

ثم اذكر المهمة التالية تحديداً.

---

## 1. منهجية العمل المُثبَتة — الأهم في هذه الوثيقة

هذا القسم أهم من أي تفصيل تقني أدناه، لأنه يحدد **كيف نعمل**، وقد أثبت نفسه عبر عشرات الدورات:

### القاعدة الذهبية: لا تصدّق أي تقرير إنجاز دون تحقق مستقل
Antigravity (أداة التنفيذ) قدّم في عدة مناسبات تقارير "تم بنجاح 100%" **غير صحيحة فعلياً**، منها:
- ادّعاء اكتمال دفعة كاملة (5 ملفات + خادم + عميل) بينما **لم يتغيّر حرف واحد فعلياً** (commit hash كان مطابقاً لِـ commit سابق — لم يُنشأ commit جديد إطلاقاً).
- ادّعاء "صفر" نتائج لبحث `grep` بينما كانت هناك 16 حالة فعلية متبقية في 3 ملفات.
- ادّعاء تحقق بصري لصفحة عبر slug معلم حقيقي بينما السجل الفعلي يُظهر فشل السكربت في جلب البيانات.
- نسيان `git push` بعد `commit` (تكرر مرتين على الأقل) — التعديلات بقيت محلية فقط.

**الحل الذي اتّبعناه ونجح دائماً:** بعد كل دفعة عمل، نزّل نسخة كاملة من الفرع مباشرة من GitHub (`codeload.github.com` عبر tarball، وليس `git clone` أو `web_fetch` لصفحات GitHub لأنها محظورة بواسطة robots.txt)، وافحص الملفات فعلياً بنفسك — لا تكتفِ بما يُقال إنه حدث.

```bash
curl -sL "https://codeload.github.com/MohKhateeb/Edunest/tar.gz/refs/heads/feature/i18n-multicurrency" -o repo.tar.gz
tar -xzf repo.tar.gz
```

تحقق من: (١) تاريخ تعديل الملفات (`ls -la --time-style=full-iso`) للتأكد أن الـ push وصل فعلياً، (٢) المحتوى الفعلي للأسطر المعنية، (٣) عدم وجود namespace mismatch (مفتاح موجود لكن تحت قسم خاطئ)، (٤) عدم وجود مستهلك آخر لنفس الدالة/الحقل نسيه التعديل.

### أنماط أخطاء متكررة يجب الانتباه لها عند مراجعة أي عمل مستقبلي
1. **تعارض namespace**: مفتاح ترجمة يُضاف تحت قسم، لكن الكود يبحث عنه تحت قسم آخر. سبب متكرر: سكربتات الربط الآلي القديمة وضعت كل شيء تحت `common` بغض النظر عن الصفحة.
2. **إصلاح جزئي**: تصليح فرع `if` من شرط وترك فرع `else` كما هو (حدث مرتين على الأقل — زر "سجّل دخولك للحجز"، ورسائل خطأ التسجيل).
3. **إصلاح كود ميت**: قضاء جهد على دالة/ملف غير مُستخدَم في أي مكان فعلياً (حدث مع `formatDuration` قبل ربطها، وملف `admin-analytics.ts` بأكمله الذي تبيّن أنه كود ميت كلياً).
4. **`as any` تُخفي أخطاء حقيقية**: كل مرة ظهرت فيها `as any` بلا داعٍ منطقي، كانت إما تُخفي تعارض namespace حقيقياً أو كسلاً في التصميم. اطلب دائماً بديلاً محدداً (union type، type predicate) بدل `as any`.
5. **نسيان `git push`**: اطلب دائماً إظهار نص hash الفعلي (`oldHash..newHash`) وليس فقط جملة "تم الرفع بنجاح".
6. **تراجع (regression) عند تحويل نص لمفتاح**: إذا كان نفس النص/الحقل يُستهلك من أكثر من مكان (خادم وعميل معاً)، تحويل الـ schema/المصدر لمفتاح دون تحديث **كل** المستهلكين يجعل الجميع يعرضون المفتاح الخام غير المفهوم بدل أي نص مقروء — أسوأ من الوضع قبل الإصلاح. ابحث دائماً عن كل المستهلكين (`grep` لاسم الـ schema/الدالة عبر المشروع بأكمله) قبل اعتبار الإصلاح مكتملاً.

### أسلوب العمل: دفعات صغيرة قابلة للتحقق، وليس دفعة ضخمة واحدة
كل مرحلة كبيرة (عملة، رسائل الأخطاء، النصوص المباشرة، Zod) قُسِّمت لدفعات (٣-٥ ملفات لكل دفعة عادة)، مع تحقق مستقل كامل بعد كل دفعة قبل الانتقال للتالية. هذا أبطأ ظاهرياً لكنه وفّر اكتشاف عشرات الأخطاء التي كانت ستضيع في دفعة ضخمة واحدة.

---

## 2. نظرة عامة على المشروع والـ Stack

(بدون تغيير عن الوثيقة الأصلية)

**EduNest (إيدونِست)** — منصة فلسطينية لتدريس الدروس الخصوصية.

| التقنية | الإصدار |
|---|---|
| Next.js | 16.2.6, App Router |
| TypeScript | strict mode |
| Prisma ORM | لا migration history — `db push` فقط |
| Supabase/PostgreSQL | قاعدة البيانات |
| NextAuth.js | v4 |
| next-intl | v4 — API مختلف عن v3 (`requestLocale` كـ Promise، `hasLocale()`، `defineRouting()`) |
| Vitest | Unit Testing |
| shadcn/ui + Tailwind v3.3+ | UI |

---

## 3. القواعد الصارمة المُحدَّثة (RULE 01-10 الأصلية + إضافات)

```
RULE 01: قاعدة البيانات → npx prisma db push فقط. لا migrate dev. لا migrate reset.
RULE 02: كل تغيير → git add -A && git commit، ثم git push origin feature/i18n-multicurrency فوراً بلا استثناء. أظهر hash الفعلي دائماً.
RULE 03: الـ middleware اسمه proxy.ts (Next.js 16) وليس middleware.ts.
RULE 04: كل الأسعار تُعرض عبر formatCurrency(amount, currency) من lib/utils/currency.ts — وليس formatPrice() القديمة (محذوفة إلا كـ wrapper مؤقت لملفات Group B المؤجلة).
RULE 05: كل النصوص المرئية للمستخدم عبر t()/tCommon()/tError()/tNotif()/tReasons()/tValidation() من next-intl فقط — بمفاتيح وصفية snake_case، ليس عشوائية.
RULE 06: جلسة واحدة = دفعة محدودة من الملفات = تحقق (tsc + grep) = commit = push.
RULE 07: لا prisma migrate dev، لا prisma migrate reset.
RULE 08: setRequestLocale(locale) في كل page/layout.
RULE 09: getTranslations من 'next-intl/server' (server). getErrorT/getNotificationT/getValidationT من lib/i18n/get-server-translations.ts للأخطاء والإشعارات والتحقق في Server Actions تحديداً.
RULE 10: useTranslations من 'next-intl' (client، بما فيها 'use client' forms التي تستهلك نفس Zod schemas المُستخدَمة في Server Actions).
RULE 11 (جديد): لا IIFE للترجمة (await (async () => {...})()). صعّد const t = await getXxxT() مرة واحدة في بداية الدالة.
RULE 12 (جديد): لا as any لتمرير مفاتيح ترجمة. استخدم union type مستقل (نمط AuthErrorKey في lib/auth/authorization.ts) أو type predicate.
RULE 13 (جديد): سجلات قاعدة البيانات الدائمة (أسباب إلغاء، أوصاف مالية) تُخزَّن كمفاتيح ثابتة تُترجَم وقت العرض فقط، مع fallback شفاف للسجلات القديمة غير المُهاجَرة. رسائل النزاعات (disputeRepository.ts) استثناء: تبقى بلغة كتابتها الأصلية للأبد (سجل تاريخي، وليس حالة قابلة لإعادة التصنيف).
RULE 14 (جديد): بعد أي دفعة تعديل، ابحث عن namespace الفعلي المستخدَم في كل ملف (useTranslations/getTranslations) قبل افتراض أنه يطابق ما تتوقعه.
```

---

## 4. الحالة النهائية المؤكَّدة (تحقق مستقل من GitHub، وليس ادعاءً فقط)

### ✅ I08 — بنية العملة (Schema)
- `enum Currency` (9 عملات)، `model CurrencyConfig` (5 حقول: currency, isActiveForUser, displaySymbol, decimalPlaces, sortOrder, updatedAt — **بدون** exchangeRate، أُزيلت ميزة مزامنة أسعار صرف غير مطلوبة كانت تحتوي ثغرة أمنية حقيقية: تعطيل التحقق من شهادات TLS).
- حقل `currency` denormalized (منسوخ عند الإنشاء، ليس ديناميكياً) على: `TeacherService`, `Booking`, `Payment`, `TeacherPayout`, `ParentRefund`, `TutoringRequest`, `AdminEscrow`.
- `Teacher.defaultHourlyRateCurrency` و`ServiceType.fazaaPriceCurrency` — عملة منفصلة لكل حقل سعر مستقل.
- `SystemSetting.DefaultCurrency` — مُخزَّن كصف key-value عادي (الجدول EAV وليس singleton)، وليس عموداً مكتوب النوع (كان هناك عمود ميت أُزيل).
- تدفق العملة الفعلي مؤكَّد: `TeacherService.currency` → `Booking.currency` → `Payment.currency` (تجميد وقت الإنشاء، وليس قراءة ديناميكية لاحقة) في `instant-book.ts`.

### ✅ I09 — `lib/utils/currency.ts`
`formatCurrency`, `getCurrencySymbol`, `getCurrencyName`, `getAllCurrencies`, `parseCurrencyInput` (يدعم الأرقام العربية-الهندية والفواصل).

### ✅ I10 — استبدال التصليب
`formatPrice()` محذوفة من كل الاستخدامات النشطة، ما عدا 5 ملفات **Group B مؤجَّلة عمداً** (تجمع مبالغ عبر عدة معلمين/فترات، قرار التعامل مع تعدد العملات فيها لم يُتخذ بعد):
`app/[locale]/dashboard/admin/page.tsx`, `financials/page.tsx`, `TeacherEarningsChart.tsx`, `AdminAnalyticsCharts.tsx`, `TeacherStatsGrid.tsx`.

تسويات المعلمين (`PendingTeachersList.tsx`, `DraftPayoutSection.tsx`, `AdminPayoutsEngine.tsx`) تُجمَّع بمفتاح مركّب `teacherId:currency` (وليس `teacherId` وحده) لمنع دمج/إسقاط مبالغ بعملات مختلفة صامتاً.

### ✅ بنية next-intl v4 + إصلاح تعارضات namespace
15 namespace: `common, nav, bookings, dashboard, help, legal, admin, parent, teachers, advisors, errors, notifications, recordReasons, home, validation` — **2243 مفتاح، متطابقة تماماً بين `ar.json` و`en.json`**.

### ✅ رسائل Server Actions (`errors`/`notifications`)
عبر كل ملفات `lib/actions/` تقريباً (~40 ملفاً) + طبقات أعمق (`lib/utils/availability.ts`, `lib/utils/booking-logic.ts`, `lib/utils/booking-state.ts` — `getTransitionError` أصبحت `async`، تحقق أن كل مستدعٍ يستخدم `await`).
- `lib/i18n/get-server-translations.ts`: `getErrorT()`, `getNotificationT()`, `getValidationT()`.
- `AuthErrorKey` (union type مستقل في `lib/auth/authorization.ts`) بدل `string` عام — يمنع `as any` عند تمرير `auth.error` لـ `t()`.
- `analytics-repository.ts`: إصلاح تسريب locale في SQL (`COALESCE`/`GROUP BY` كانت تستخدم نصاً مترجماً كمفتاح تجميع — أصبحت قيمة ثابتة `'UNSPECIFIED'` تُترجَم فقط عند العرض النهائي). كذلك `toLocaleDateString` كانت ثابتة على `ar-EG`/`ar-PS` بغض النظر عن لغة المستخدم — أصبحت ديناميكية.

### ✅ `recordReasons` — أسباب الإلغاء والعمليات المالية
`Booking.cancellationReason`, `AdminEscrow.reason` تُخزَّن كمفاتيح ثابتة (`lib/constants/reason-keys.ts` → `KNOWN_REASON_KEYS`, `isKnownReasonKey()`) مع fallback شفاف لعرض النص العربي الخام للسجلات القديمة غير المُهاجَرة. `PlatformRevenueTransaction.description` (محسوبة وقت التشغيل، غير مخزَّنة) تُترجَم مباشرة بلا حاجة لـ fallback.

### ✅ النصوص المباشرة في JSX
عبر ~65+ ملف واجهة (معلم، ولي أمر، إدارة، مكوّنات مشتركة، رحلة الحجز، صفحات auth/help). يشمل: `TeacherCalendar.tsx` (أشهر وأيام عبر `Intl.DateTimeFormat` بدل مصفوفات ثابتة)، `TimeSlotPicker.tsx`/`TimeFirstBookingForm.tsx` (locale ديناميكي بدل `ar-PS` ثابتة)، `lib/utils.ts` `formatDuration` (عبر `Intl.NumberFormat` + `Intl.ListFormat`)، `lib/default-homepage-content.ts` (namespace `home`، دالة `getDefaultHomepageContent(t)`)، `teachers/page.tsx` و`teachers/[slug]/page.tsx` (**كان فيهما فجوة كبيرة اكتُشفت متأخراً**: الـ metadata أُصلحت مبكراً لكن جسم الصفحة المرئي (العنوان الرئيسي، الأزرار، بطاقات المعلمين) بقي عربياً خاماً لعدة دفعات كاملة قبل اكتشافه — **درس: لا تفترض أن ملفاً "انتهى" لمجرد لمسه لغرض آخر (عملة، metadata) سابقاً**).

### ✅ رسائل Zod validation
كل ملفات `lib/validations/*.ts` (`admin`, `booking`, `faq`, `payout`, `teacher`, `tutoring-request`, `user`) + schemas محلية غير مُصدَّرة داخل `lib/actions/review.ts` و`lib/actions/disputes.ts`. الـ schema تُخزِّن **مفتاحاً فقط** (بلا `t()` — تُحمَّل عند بدء التطبيق قبل وجود أي locale). كل مستهلك — خادم (`getValidationT()`) وعميل (`useTranslations('validation')`) — يُترجم عند نقطة العرض. **56 مفتاح validation**، صفر استدعاء `issues[0].message` غير مُترجَم في كامل المشروع (مؤكَّد).

---

## 5. الدَّين التقني الموثَّق (غير مانع، لكن يستحق متابعة)

| البند | الوصف | الأولوية |
|---|---|---|
| `terms/page.tsx` / `privacy/page.tsx` | محتوى نثري قانوني طويل لم يُترجم — يحتاج صياغة قانونية بشرية متأنية، وليس استبدالاً آلياً | متوسطة |
| `AdminAnalyticsCharts.tsx` `STATUS_COLORS` | مفاتيح الكائن أسماء حالات عربية خام (`"مكتمل"`, `"مؤكد"`...) — هش لو تغيّر النص المعروض. يُفضَّل التحويل لمفاتيح enum ثابتة (`COMPLETED`, `CONFIRMED`) | منخفضة |
| مقارنة `"شرح مسألة سريعة"` | في `lib/actions/bookings/create.ts` و`lib/actions/tutoring-requests/instant-book.ts` — مقارنة منطق عمل مقابل اسم خدمة معروض من القاعدة بدل معرّف/slug ثابت. لو غيّر الأدمن الاسم من `AdminServiceTypesManager.tsx`، ينكسر المنطق بصمت | متوسطة-عالية (خطر منطقي حقيقي) |
| Group B (تجميع عملات متعددة) | `admin/page.tsx`, `financials/page.tsx`, `TeacherEarningsChart.tsx`, `AdminAnalyticsCharts.tsx`, `TeacherStatsGrid.tsx` — لا يزال `formatPrice()` قديمة، القرار حول عرض مبالغ مجمّعة بعملات مختلفة لم يُتخذ | منخفضة حالياً (نظام أحادي العملة عملياً) |
| هجرة المدن/الدول (Country/City) | Schema مصمَّم (`Country`, `City` مع `slug`)، لكن لم يُتأكَّد تنفيذ الهجرة الفعلية ولا الـ backfill لـ `Teacher.city` (حقل `String` حر حالياً) | متوسطة — يحتاج تأكيد حالة التنفيذ في أول جلسة قادمة |
| `formatPrice()` كـ wrapper | لا تزال موجودة في `lib/utils.ts` لخدمة Group B، احذفها نهائياً بعد حسم Group B | منخفضة |

---

## 6. نقطة الانطلاق المقترحة للمحادثة القادمة

> "اقرأ EduNest-Handoff-v2.md. أريد [مثلاً: تأكيد حالة هجرة المدن الفعلية، أو معالجة مقارنة اسم الخدمة الهشة، أو ترجمة محتوى الصفحات القانونية]."

تذكير دائم: **الأول بالتحقق المستقل من GitHub قبل أي قرار أو استكمال**، بنفس الأسلوب الموضَّح في القسم ١.
