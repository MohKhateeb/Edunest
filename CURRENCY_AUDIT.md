# Currency Implementation Audit

## 1. Schema — الحقول الفعلية الموجودة الآن

✅ **تم التحقق بالكامل**

**تعريف enum Currency:**
```prisma
enum Currency {
  ILS
  USD
  EUR
  JOD
  EGP
  SAR
  AED
  QAR
  KWD
}
```

**تعريف model CurrencyConfig:**
```prisma
model CurrencyConfig {
  currency        Currency @id
  isActiveForUser Boolean  @default(false)
  displaySymbol   String
  decimalPlaces   Int      @default(2)
  sortOrder       Int      @default(0)
  exchangeRate    Float    @default(1.0)
  updatedAt       DateTime @updatedAt

  @@map("currency_configs")
}
```

**كل حقل currency تمت إضافته فعلياً:**
1. `CurrencyConfig` (الحقل الأساسي للموديل: `currency Currency @id`)
2. `User` -> `preferredCurrency Currency?`
3. `TeacherService` -> `currency Currency @default(ILS)`
4. `Booking` -> `currency Currency @default(ILS)`
5. `Payment` -> `currency Currency @default(ILS)`
6. `TeacherPayout` -> `currency Currency @default(ILS)`
7. `ParentRefund` -> `currency Currency @default(ILS)`
8. `TutoringRequest` -> `currency Currency @default(ILS)`
9. `AdminEscrow` -> `currency Currency @default(ILS)`

⚠️ **موديلات تحتوي على `Decimal` (مبلغ مالي) ولكنها *لا تحتوي* على حقل `currency` (فجوات):**
1. **`Teacher`**: الحقل `defaultHourlyRate Decimal? @db.Decimal(10, 2)` لا يملك عملة مرتبطة به.
2. **`ServiceType`**: الحقل `fazaaPrice Decimal? @db.Decimal(10, 2)` (سعر الفزعة الموحد) لا يملك عملة مرتبطة به.
3. **`Booking`**: الحقل `trialCostToPlatform Decimal @default(0) @db.Decimal(10, 2)` (يُفترض أنه يشارك نفس عملة الحجز، لكن يجدر ذكره).

---

## 2. Seed Data — تحقق فعلي من قاعدة البيانات

✅ **تم التحقق بالكامل** (عبر سكربت استعلام فعلي لقاعدة البيانات `verify-seed.ts`)

**النتيجة الفعلية للاستعلام:**
الجدول يحتوي فعلياً على **9 صفوف**. عملة `ILS` هي الوحيدة المفعّلة للمستخدمين (`isActiveForUser: true`) بينما الباقي `false`.

```json
[
  {
    "currency": "ILS",
    "isActiveForUser": true,
    "displaySymbol": "₪",
    "decimalPlaces": 2,
    "sortOrder": 0,
    "exchangeRate": 2.994336,
    "updatedAt": "2026-07-04T19:19:39.761Z"
  },
  {
    "currency": "KWD",
    "isActiveForUser": false,
    ...
  },
  {
    "currency": "SAR",
    "isActiveForUser": false,
    ...
  },
  {
    "currency": "EUR",
    "isActiveForUser": false,
    ...
  },
  {
    "currency": "EGP",
    "isActiveForUser": false,
    ...
  },
  {
    "currency": "QAR",
    "isActiveForUser": false,
    ...
  },
  {
    "currency": "JOD",
    "isActiveForUser": false,
    ...
  },
  {
    "currency": "AED",
    "isActiveForUser": false,
    ...
  },
  {
    "currency": "USD",
    "isActiveForUser": false,
    "displaySymbol": "$",
    "decimalPlaces": 2,
    "sortOrder": 1,
    "exchangeRate": 1,
    "updatedAt": "2026-07-04T19:19:39.762Z"
  }
]
```

---

## 3. Hardcoded Currency Scan — بحث شامل في كل الكود

✅ **تم التحقق بالكامل** (عبر بحث `grep` الفعلي في `app/`, `lib/`, `components/`):

- **الرمز ₪:**
  - `app/[locale]/terms/page.tsx:58` — `بالشيكل الإسرائيلي (₪).`
  - `lib/validations/teacher.ts:16` — `الحد الأدنى لسعر الساعة هو 5 ₪`
  - `lib/validations/teacher.ts:22` — `الحد الأدنى للسعر هو 5 ₪`
  - *(استُبعدت نتائج ملف utils و seed لأنها تعريفات شرعية للعملة)*

- **الكلمة "شيكل":**
  - `app/[locale]/dashboard/admin/_components/AdminSettingsForm.tsx:129` — `{ value: "ILS", label: "شيكل (ILS)" }`
  - `app/[locale]/dashboard/teacher/_components/TeacherServicesForm.tsx:120` — `وسعرها بالشيكل`
  - `app/[locale]/terms/page.tsx:58` — `بالشيكل الإسرائيلي (₪)`
  - `components/shared/PersonalProfileForm.tsx:207` — `<option value="ILS">شيكل (ILS)</option>`
  - `lib/actions/tutoring-requests/instant-book.ts:62` — `// افتراضي 50 شيكل`

- **الكلمة "دولار":**
  - `app/[locale]/dashboard/admin/_components/AdminSettingsForm.tsx:130` — `{ value: "USD", label: "دولار أمريكي (USD)" }`
  - `components/shared/PersonalProfileForm.tsx:208` — `<option value="USD">دولار أمريكي (USD)</option>`

- **الرمز $ و الكلمات USD, EUR:**
  - تظهر فقط في `AdminSettingsForm.tsx` و `PersonalProfileForm.tsx` كخيارات، وفي خدمة `exchange-rate-service.ts` كمصدر لسعر الصرف (Base Currency). لم تظهر مجاورة لأرقام هاردكود في الواجهات.

- **دالة `toFixed(2)`:**
  - لم يُعثر على أي نتيجة لاستخدامها المباشر في الكود، مما يعني أن الكود يعتمد على دوال التنسيق المخصصة.

---

## 4. حالة I09 — Currency Utility

⚠️ **منجز جزئياً** (الملف موجود ولكن بعض الدوال مفقودة)

بالتحقق من `lib/utils/currency.ts`:
- ✅ `formatCurrency(amount, currency)`: **موجودة فعلياً** ومُحدّثة لتدعم استلام `currency` كمعامل (Param).
- ❌ `getCurrencyName(currency, locale)`: **غير موجودة**.
- ❌ `getAllCurrencies()`: **غير موجودة**.
- ❌ `parseCurrencyInput(value)`: **غير موجودة**.

الملف يحتوي حالياً على دوال التنسيق وجلب الرمز (`getCurrencySymbol`) فقط.

---

## 5. تتبع تدفق العملة عبر الطبقات (الأهم)

❌ **فجوة منطقية (Logical Gap) واضحة**

**المسار المفحوص:** عملية إنشاء حجز فوري (`instant-book.ts`) من `TutoringRequest` / `TeacherService` إلى `Booking` ثم `Payment`.

- **هل `currency` يُنسخ (denormalize) بشكل صريح؟**
  **لا.** في `lib/actions/tutoring-requests/instant-book.ts` السطر 139، يتم إنشاء الحجز `tx.booking.create` ويتم تحديد `price` و `teacherServiceId`، ولكن **يتم تجاهل نسخ حقل العملة `currency`** من الـ `TeacherService` أو الـ `TutoringRequest`.

- **نفس الشيء عند إنشاء `Payment`:**
  في نفس الملف السطر 161، عند استدعاء `tx.payment.create`، يتم تمرير الـ `amount` بدون ذكر حقل `currency` إطلاقاً.

- **النتيجة والفجوة المنطقية:**
  الكود يعتمد بشكل كامل وصامت على القيمة الافتراضية `@default(ILS)` في Schema قاعدة البيانات. هذا يعني أنه حتى لو قام المعلم بتحديد سعر خدمته بالدولار الأمريكي (USD)، سيتم إنشاء الحجز والدفعة بشيكل (ILS) بنفس الرقم، مما سيؤدي لكارثة مالية.

---

## 6. TypeScript Check

✅ **تم التحقق بالكامل**

تم تشغيل أمر `npx tsc --noEmit` بنجاح واكتمل **بدون أي أخطاء** (Exit Code 0).
هذا يؤكد أن خطأ الـ `metadata-export` القديم الذي كان يظهر سابقاً لم يعد موجوداً، ولا توجد أي أخطاء TypeScript جديدة ظهرت بعد تعديلاتك الأخيرة.

---

### توصيات (لا يتم تنفيذها في هذه الجلسة):
1. إضافة حقول `currency` للمبالغ المتبقية في Schema (`Teacher.defaultHourlyRate` و `ServiceType.fazaaPrice`).
2. إضافة الدوال المفقودة في `lib/utils/currency.ts` لتسهيل جلب الأسماء المترجمة وقراءة المدخلات.
3. التخلص من النصوص العربية والرموز المالية الهاردكود (₪، شيكل) في Validation و Forms لتُقرأ ديناميكياً من المرفق الجديد.
4. **الأهم:** عمل مراجعة شاملة لجميع Server Actions التي تنشئ `Booking` و `Payment` وتحديثها لتقوم بنسخ حقل العملة `currency` بشكل صريح من الـ Parent entity.
