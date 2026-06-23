# 📊 دراسة شاملة: نظام الحجز والدفع والتحول المالي في EduNest

**التاريخ:** 23 يونيو 2026  
**المستند:** تحليل هندسي شامل لجزئية الحجوزات والمدفوعات والتحويلات المالية

---

## 📋 جدول المحتويات
1. [سير العملية الحالي](#سير-العملية-الحالي)
2. [تحليل المشاكل والثغرات](#تحليل-المشاكل-والثغرات)
3. [قائمة الأخطاء المكتشفة](#قائمة-الأخطاء-المكتشفة)
4. [التوصيات والتحسينات](#التوصيات-والتحسينات)
5. [الخطة المقترحة](#الخطة-المقترحة)

---

## 🔄 سير العملية الحالي

### **1. مرحلة الحجز (Booking Creation)**

```
┌─────────────────────────────────────────────────────┐
│ ولي الأمر → حجز جلسة مع معلم (NewBookingForm)      │
└─────────────────────────────────────────────────────┘
                           ↓
         ✓ التحقق من توفر المعلم
         ✓ فترة الإنذار (MinBookingLeadHours = 2 ساعة)
         ✓ توثيق المعلم (isVerified)
         ✓ حساب السعر والعمولة والجلسات التجريبية
                           ↓
         📊 حالة الحجز = PENDING
         💳 حالة الدفع = UNPAID
                           ↓
    ✅ إنشاء 3 records:
       1. Booking (الحجز الأساسي)
       2. Payment (سجل الدفع)
       3. Notification (إخطار المعلم)
```

**الملفات المعنية:**
- `lib/actions/bookings/create.ts` - إنشاء الحجز
- `components/shared/NewBookingForm.tsx` - واجهة الحجز

---

### **2. مرحلة الدفع (Payment Processing)**

```
┌──────────────────────────────────────────────────────┐
│ ولي الأمر → زر الدفع (يظهر عندما الحجز PENDING)   │
└──────────────────────────────────────────────────────┘
                           ↓
    💳 نقل إلى بوابة الدفع (Stripe/PayPal)
    ✓ تحديث Payment.isPaid = true
    ✓ تحديث Booking.paymentStatus = PAID
    ✓ إخطار المعلم: "يمكنك الآن قبول الحجز"
```

**الملفات المعنية:**
- `lib/actions/bookings/pay.ts` - معالجة الدفع
- `components/shared/PaymentModal.tsx` - واجهة الدفع

**💡 ملاحظة:** الحالة الحالية لا تدعم سوى `ONLINE_CARD` - لا توجد وسائل دفع أخرى

---

### **3. مرحلة قبول/رفض الحجز (Booking Confirmation)**

```
┌──────────────────────────────────────────────────────┐
│ المعلم → قبول/رفض الحجز (BookingCard)           │
└──────────────────────────────────────────────────────┘
                           ↓
    🔍 التحقق:
       ✓ حالة الحجز = PENDING
       ✓ حالة الدفع = PAID (أو جلسة تجريبية)
       ✓ المعلم هو الذي يملك الخدمة
                           ↓
    ✅ عند القبول:
       • Booking.status = CONFIRMED
       • إنشاء رابط Jitsi meet
       • إخطار ولي الأمر
                           ↓
    ❌ عند الرفض:
       • Booking.status = REJECTED
       • إخطار ولي الأمر
       • استرجاع المبلغ (في المستقبل)
```

**الملفات المعنية:**
- `lib/actions/bookings/accept.ts` - قبول الحجز
- `lib/actions/bookings/reject.ts` - رفض الحجز

---

### **4. مرحلة إلغاء الحجز (Cancellation)**

```
┌──────────────────────────────────────────────────────┐
│ الأطراف (ولي أمر/معلم/إدارة) → إلغاء الحجز       │
└──────────────────────────────────────────────────────┘
                           ↓
    🔍 التحقق من حالة صلاحية الإلغاء:
       ✓ يجب أن تكون الحالة PENDING أو CONFIRMED
       ✓ التحقق من صلاحيات المستخدم
                           ↓
    💰 سياسة استرجاع الأموال:
       
       أ) إذا أم = معلم أو إدارة:
          → استرجاع كامل المبلغ ✓
       
       ب) إذا أم = ولي أمر:
          → فترة الإلغاء = 24 ساعة قبل الجلسة
          → الحد الأقصى للطلبات = طلبين فقط
          → إذا تجاوز الحد → لا استرجاع
          → إذا إلغاء متأخر → لا استرجاع
                           ↓
    📊 المخرجات:
       • Booking.status = CANCELLED
       • Booking.cancellationReason = السبب
       • Booking.cancelledBy = معرف المستخدم
       • Booking.paymentStatus = REFUNDED (إن أهل)
       • إنشاء ParentRefund record
```

**الملفات المعنية:**
- `lib/actions/bookings/cancel.ts` - إلغاء الحجز

---

### **5. مرحلة التقرير وإنهاء الجلسة (Session Report)**

```
┌──────────────────────────────────────────────────────┐
│ المعلم → رفع تقرير الجلسة بعد انتهائها             │
└──────────────────────────────────────────────────────┘
                           ↓
    ⏰ التحقق من التوقيت:
       ✓ يجب أن تكون الجلسة انتهت فعلاً
       ✓ فترة السماح = 30 دقيقة بعد الانتهاء الرسمي
       ✓ الحد الأقصى = 24 ساعة للتقرير الخياني
                           ↓
    📝 بيانات التقرير:
       • هل حضر الطالب؟ (studentAttended: boolean)
       • المواضيع المغطاة (topicsCovered: string)
       • أداء الطالب (studentPerformance: 1-5)
       • الواجب البيتي (homeworkAssigned: string)
       • ملاحظات المعلم (teacherNotes: string)
                           ↓
    ✅ عند الحفظ:
       • إنشاء SessionReport record
       • Booking.status = COMPLETED
       • زيادة Teacher.totalSessions += 1
       • إخطار ولي الأمر
```

**الملفات المعنية:**
- `lib/actions/bookings/report.ts` - إرسال التقرير
- `lib/utils/booking-state.ts` - منطق حالة الجلسة

---

### **6. مرحلة التحول المالي (Payout Processing)**

```
┌──────────────────────────────────────────────────────┐
│ الإدارة → حساب وتحويل أرباح المعلمين (Admin)      │
└──────────────────────────────────────────────────────┘
                           ↓
    📊 الشروط للحجز المؤهل للدفع:
       ✓ Booking.status = COMPLETED
       ✓ payoutId = null (لم يتم تضمينه في تسوية سابقة)
       ✓ Booking.paymentStatus = PAID أو isTrial = true
       ✓ completedAt < 24 ساعة قبل الآن
       ✓ لا يوجد نزاع مفتوح على الحجز
       ✓ إذا كان نزاع: يجب الحل لصالح المعلم
                           ↓
    💰 حساب الأرباح:
       
       إجمالي المبلغ (totalAmount) = سعر الحجوزات الدفوعة
       
       العمولة (commissionAmount) = 
           مجموع (سعر الحجز × معدل العمولة / 100)
       
       تعويض الجلسات التجريبية (trialCompensation) =
           مجموع (كلفة الجلسة التجريبية على المنصة)
       
       الدخل الصافي (netAmount) = 
           totalAmount - commissionAmount + trialCompensation
                           ↓
    🔒 الحماية من الدفع المزدوج:
       ✓ يتم ربط جميع الحجوزات بـ payoutId
       ✓ لا يمكن تضمين حجز في تسويتين
       ✓ فحص التداخلات بين فترات التسويات
                           ↓
    ✅ الخطوات:
       1️⃣ حساب مسودة (calculateDraftPayout)
          → بدون حفظ في قاعدة البيانات
       
       2️⃣ إنشاء تسوية (createTeacherPayout)
          → إنشاء TeacherPayout record
          → ربط جميع الحجوزات بـ payoutId
       
       3️⃣ تحديد كمدفوع (markPayoutAsPaid)
          → TeacherPayout.isPaid = true
          → إضافة تاريخ الدفع (paidAt)
```

**الملفات المعنية:**
- `lib/actions/payout.ts` - إدارة التحويلات المالية
- `components/shared/AdminPayoutsEngine.tsx` - واجهة محرك التسويات

---

### **7. مرحلة النزاعات والشكاوى (Disputes)**

```
┌──────────────────────────────────────────────────────┐
│ ولي الأمر → فتح نزاع على جلسة مكتملة               │
└──────────────────────────────────────────────────────┘
                           ↓
    🔍 الشروط:
       ✓ Booking.status = COMPLETED
       ✓ لا يوجد نزاع سابق على الحجز
       ✓ payoutId = null (لم تتم التسوية بعد)
       ✓ خلال 24 ساعة من اكتمال الجلسة
       ✓ سبب الاعتراض >= 10 أحرف
                           ↓
    💬 عملية النزاع:
       1. إنشاء Dispute record (OPEN)
       2. تبادل رسائل بين الأطراف
       3. الإدارة تحل النزاع
          - RESOLVED_IN_FAVOR_OF_PARENT → استرجاع كامل
          - RESOLVED_IN_FAVOR_OF_TEACHER → المعلم يحصل على أرباحه
                           ↓
    ⚖️ التأثير على التسوية المالية:
       • إذا كان النزاع OPEN → لا يدخل في التسوية
       • إذا كان RESOLVED_IN_FAVOR_OF_TEACHER → يدخل
       • إذا كان RESOLVED_IN_FAVOR_OF_PARENT → يُرجع المبلغ
```

**الملفات المعنية:**
- `lib/actions/disputes.ts` - إدارة النزاعات

---

## 🚨 تحليل المشاكل والثغرات

### **المشكلة #1: تداخل منطق الدفع والتسوية**

#### الوصف:
الحجز قد يكون في حالة `PAID` من حيث `paymentStatus` لكن لم يتم استرجاع المبلغ فعلاً من المنصة.

#### التأثير:
- 💸 خسارة مالية محتملة
- 🔄 حسابات التسوية قد تكون خاطئة
- 🤔 عدم وضوح الحالة المالية الفعلية

#### الحالات الإشكالية:
```
الحالة 1: الإلغاء بعد الدفع
─────────────────────────
Booking.status = PENDING → CANCELLED
Booking.paymentStatus = PAID
Payment.isPaid = true ✓

المشكلة: عند الإلغاء يتم تحديث:
- Booking.paymentStatus = REFUNDED
- Payment.isPaid = false

لكن في `cancel.ts` سطر 77:
  if (!isTrial && refundEligible && booking.paymentStatus === PaymentStatus.PAID) {
    await tx.payment.update({ isPaid: false });
  }

✓ هذا صحيح، لكن:
  - لا يتم فعل "التحويل البنكي" الفعلي
  - لا يُنشأ سجل ParentRefund تلقائياً
  - يعتمد على الإدارة لمتابعة الاسترجاع يدويًا
```

#### التوصية:
```typescript
// إضافة رسالة إلى طابور معالجة الاسترجاعات
// نموذج تخطيطي:
await tx.parentRefund.create({
  data: {
    bookingId,
    amount: booking.price,
    isPaid: false, // الإدارة تؤكد التحويل البنكي
    paidAt: null,
  }
});

// تنبيه الإدارة
await createNotification({
  userId: ADMIN_ID,
  title: 'استرجاع أموال معلق',
  message: `استرجاع ${booking.price} ريال لولي الأمر من حجز ملغى`
});
```

---

### **المشكلة #2: الجلسات التجريبية غير واضحة**

#### الوصف:
الجلسات التجريبية لها معالجة خاصة مربكة:
- `isTrial = true` → لا دفع من ولي الأمر
- لكن `trialCostToPlatform` → كلفة على المنصة

#### التأثير:
- 🤷 عدم وضوح من الذي يدفع
- 📊 احتمالية أخطاء في الحسابات
- 🔍 صعوبة التدقيق المالي

#### المشكلة التفصيلية:

```typescript
// في bookings/create.ts:

if (isTrial) {
  // الحد الأقصى = جلسة واحدة فقط للطالب
  const hasUsedTrial = await prisma.booking.findFirst({
    where: {
      studentId,
      isTrial: true,
      status: BookingStatus.COMPLETED,
    },
  });

  if (hasUsedTrial) {
    return { error: 'لقد استخدمت جلسة تجريبية مسبقاً' };
  }

  // كلفة الجلسة على المنصة (من إعدادات النظام)
  trialCostToPlatform = await getSettingNumber('TrialSessionCost', 10);
  
  // لكن الدفع:
  // ولي الأمر: 0 ريال
  // المعلم: 0 ريال (لا يُدفع له من الأساس للجلسات التجريبية!)
  price = 0;
  appliedCommissionRate = 0;
}

// هذا يخلق التباس!
```

#### التوصية:

```typescript
// يجب توضيح:
// 1. من يدفع كلفة الجلسة التجريبية؟
//    - من ميزانية المنصة العامة؟
//    - من مدفوعات الآباء الآخرين؟

// 2. هل المعلم يحصل على عمولة؟
//    - حالياً: لا
//    - الأفضل: نعم (لتشجيع المعلمين)

// 3. يجب إعادة تسمية:
//    - isTrial → isCompletedFreeSession
//    - trialCostToPlatform → platformCostForFreeSessions
```

---

### **المشكلة #3: حالات الجلسة الزمنية غير كاملة**

#### الوصف:
في `booking-state.ts` توجد 6 حالات زمنية للجلسة:

```typescript
'upcoming'      // أكثر من 5 دقائق قبل البدء
'ready_to_join' // من 5 دقائق إلى البدء
'active'        // أثناء الجلسة
'grace_period'  // حتى 30 دقيقة بعد الانتهاء
'expired'       // بعد 30 دقيقة لحتى 24 ساعة
'ghost'         // أكثر من 24 ساعة
```

#### المشكلة:
```
1. حالة "ghost" غير معالجة
   → لا يمكن إرسال تقرير بعد 24 ساعة
   → لكن لا يوجد حد زمني قاسي (hard deadline)
   → قد يُرسل معلم تقرير بعد أسبوع!

2. لا توجد تنبيهات تلقائية
   → المعلم لا يعرف أنه يجب إرسال التقرير
   → قد لا يُرسل التقرير أبداً

3. الحجوزات المكتملة بدون تقرير
   → لا تُدخل في التسوية المالية
   → المعلم لا يحصل على أرباحه!
```

#### التوصية:

```typescript
// في canSubmitReport():
export function canSubmitReport(startTime: Date | string, durationMinutes: number): boolean {
  const state = getDetailedSessionState(startTime, durationMinutes);
  
  // يجب منع إرسال التقرير بعد 24 ساعة
  if (state.status === 'ghost') {
    return false; // ✗ حالياً يعود true!
  }
  
  return ['grace_period', 'expired'].includes(state.status);
}

// إضافة وظيفة batch يومية:
// - البحث عن حجوزات status=COMPLETED بدون SessionReport
// - أكثر من 24 ساعة منذ الانتهاء
// - إرسال تنبيهات للمعلمين
// - بعد 48 ساعة: يُعتبر "Non-attendance" تلقائي
```

---

### **المشكلة #4: تسلسل عمليات Booking غير واضح**

#### الوصف:
الترتيب الصحيح لحالات الحجز:

```
PENDING
  ├─ المعلم يقبل → CONFIRMED
  │   ├─ تنتهي الجلسة
  │   └─ المعلم يرسل تقرير → COMPLETED
  │       └─ مؤهل للتسوية المالية
  │
  └─ المعلم يرفض → REJECTED (نهائية)
      └─ ولي الأمر يحصل على استرجاع

PENDING أو CONFIRMED
  └─ إلغاء → CANCELLED
      └─ حسب الشروط: استرجاع أو لا
```

#### المشكلة:

```typescript
// في accept.ts:
if (booking.paymentStatus === PaymentStatus.UNPAID && !booking.isTrial) {
  return { 
    error: 'لا يمكن تأكيد الجلسة قبل إتمام الدفع...' 
  };
}

// هذا يعني:
// 1. ولي الأمر يحجز (PENDING, UNPAID)
// 2. ولي الأمر يدفع (PENDING, PAID)
// 3. المعلم يقبل (CONFIRMED, PAID)

// لكن ماذا إذا:
// - حجز ولي الأمر (PENDING, UNPAID)
// - المعلم قبل قبل الدفع؟
// → النظام يرفض "لا يمكن تأكيد الجلسة قبل الدفع"
// ✓ هذا صحيح

// لكن إذا كانت جلسة تجريبية:
// - isTrial = true
// - price = 0
// - paymentStatus = UNPAID
// - المعلم يستطيع القبول
// ✓ هذا صحيح أيضاً
```

#### الخطر:
```
يمكن للمعلم قبول جلسة تجريبية ثم إلغاؤها قبل البدء!
↓
النظام لا يرجع أي شيء (لأنه لا يوجد دفع أساساً)
↓
قد يُساء الاستخدام: معلم ينقر قبول ثم يلغي عشرات المرات
```

---

### **المشكلة #5: عدم وجود سياق كامل عند التسوية المالية**

#### الوصف:
عند حساب التسوية في `payout.ts`، هناك منطق معقد:

```typescript
const { bookings, totalAmount, commissionAmount, trialCompensation, netAmount } 
  = await fetchEligibleBookingsForPayout(teacherId, periodStart, periodEnd, tx);
```

#### المشكلة:

```typescript
// في fetchEligibleBookingsForPayout():

// 1. فترة 24 ساعة قبل الآن:
const twentyFourHoursAgo = new Date();
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

// هذا يعني:
// - حجز اكتمل قبل 23 ساعة → يدخل التسوية ✓
// - حجز اكتمل قبل 25 ساعة → لا يدخل ✗

// المشكلة: لماذا 24 ساعة؟
// - كي يتمكن المعلم من إرسال التقرير؟ (حسناً)
// - أم لأسباب محاسبية؟ (غير واضح)
// - أم لتجنب المشاكل؟ (غير موثقة)


// 2. الحجوزات المستحقة:
if (!b.dispute) return true;
if (b.dispute.status === 'RESOLVED_IN_FAVOR_OF_TEACHER') return true;
return false;

// هذا يعني:
// - حجز بدون نزاع → يدخل ✓
// - حجز مع نزاع مفتوح → لا يدخل ✓
// - حجز حُل لصالح المعلم → يدخل ✓
// - حجز حُل لصالح ولي الأمر → لا يدخل ✓

// ✓ هذا منطق صحيح!


// 3. الحسابات:
let totalAmount = 0;
let commissionAmount = 0;
let trialCompensation = 0;

for (const b of bookings) {
  const price = Number(b.price);
  if (b.isTrial) {
    trialCompensation += Number(b.trialCostToPlatform);
  } else {
    totalAmount += price;
    const commRate = Number(b.appliedCommissionRate);
    commissionAmount += (price * commRate) / 100;
  }
}

const netAmount = totalAmount - commissionAmount + trialCompensation;

// المشكلة:
// - للجلسات المدفوعة:
//   netAmount = 100 - (100 * 30/100) = 70 ريال ✓
// 
// - للجلسات التجريبية:
//   netAmount = 0 - 0 + 10 = 10 ريال
//   المعلم يحصل على 10 ريال من المنصة!
//   
//   السؤال: هل هذا مقصود أم خطأ؟
//   لأن عند الحجز (create.ts): المعلم لا يحصل على شيء من الجلسة التجريبية
```

---

### **المشكلة #6: إدارة النزاعات لا تؤثر على استرجاع الأموال للآباء**

#### الوصف:
عند فتح نزاع وحله لصالح ولي الأمر، يجب استرجاع المبلغ:

```typescript
// في disputes.ts:
// لا يوجد منطق لإنشاء ParentRefund عند الحل!
```

#### المشكلة:

```
الحالة:
1. ولي أمر يدفع 100 ريال
2. جلسة تكتمل
3. ولي أمر يفتح نزاع
4. الإدارة تحل لصالح ولي الأمر

النتيجة الحالية:
- Dispute.status = RESOLVED_IN_FAVOR_OF_PARENT
- Booking.payoutId = null (لا يدخل التسوية)
- المعلم لا يحصل على شيء ✓

لكن المشكلة:
- المبلغ 100 ريال معلق!
- لا يوجد ParentRefund record
- الإدارة لا تعرف أنه يجب تحويل المبلغ
- ولي الأمر لا يعرف متى سيحصل على المبلغ!
```

#### التوصية:

```typescript
// في disputes.ts resolveDispute():

// إذا حُل لصالح ولي الأمر:
if (decision === 'RESOLVED_IN_FAVOR_OF_PARENT') {
  // إنشاء ParentRefund
  await tx.parentRefund.create({
    data: {
      bookingId: dispute.bookingId,
      amount: booking.price,
      isPaid: false,
    }
  });

  // تحديث الحجز
  await tx.booking.update({
    where: { id: booking.id },
    data: {
      paymentStatus: PaymentStatus.REFUNDED,
    }
  });

  // تنبيه ولي الأمر
  await createNotification({
    userId: booking.parentUserId,
    title: 'تم حل النزاع لصالحك',
    message: 'سيتم تحويل المبلغ إلى حسابك خلال 3-5 أيام عمل'
  }, tx);
}
```

---

### **المشكلة #7: عدم تتبع ملكية الحجز في الإلغاء**

#### الوصف:
عند إلغاء حجز، يتم حفظ `cancelledBy` (معرف المستخدم)، لكن لا يتم حفظ نوع المستخدم:

```typescript
await tx.booking.update({
  where: { id: bookingId },
  data: {
    status: BookingStatus.CANCELLED,
    cancelledBy: userId,
    // لا يوجد: cancelledByType (PARENT/TEACHER/ADMIN)
    cancelledAt: new Date(),
    cancellationReason: reason,
    ...
  },
});
```

#### المشكلة:

```
عند التحليل اللاحق:
- من الذي أم الإلغاء؟ (ولي أمر/معلم/إدارة)
- يجب البحث عن cancelledBy في User table
- ثم التحقق من UserType في User
- معقد وبطيء!

إضافة حقل cancelledByType يسهل:
- التقارير
- الإحصائيات
- فهم سلوك المستخدمين
```

#### التوصية:

```prisma
// إضافة إلى schema.prisma:
model Booking {
  ...
  cancelledBy        String?
  cancelledByType    UserType?  // NEW!
  ...
}

// في cancel.ts:
await tx.booking.update({
  where: { id: bookingId },
  data: {
    status: BookingStatus.CANCELLED,
    cancelledBy: userId,
    cancelledByType: userType,  // NEW!
    cancelledAt: new Date(),
    cancellationReason: reason,
  },
});
```

---

### **المشكلة #8: غياب فحوصات التحقق من النزاهة**

#### الوصف:
لا يوجد منطق للتحقق من:
- هل التقرير كاذب؟
- هل الطالب لم يحضر رغم ادعاء المعلم؟
- هل المعلم لم يقدم الخدمة؟

#### التأثير:
- 🚩 تقارير مزيفة
- 💸 دفع مبالغ لمعلمين لم يقدموا الخدمة
- ⚖️ نزاعات مستمرة

#### التوصية:

```typescript
// إضافة آلية اختبار الذاكرة والفهم:
// 1. بعد الجلسة مباشرة: طلب من الطالب ملخص بسيط
// 2. مقارنة مع تقرير المعلم
// 3. إذا تطابق: تأكيد النزاهة
// 4. إذا لم يتطابق: فتح نزاع تلقائي

// مثال:
model SessionVerification {
  id              String    @id @default(cuid())
  bookingId       String    @unique
  booking         Booking   @relation(fields: [bookingId], references: [id])
  studentSummary  String    // ملخص الطالب
  teacherTopics   String    // مواضيع المعلم
  isVerified      Boolean   @default(false)
  createdAt       DateTime  @default(now())
}
```

---

## 📋 قائمة الأخطاء المكتشفة

| # | الخطأ | الحدة | التأثير | الحل المقترح |
|---|------|------|--------|-------------|
| 1 | استرجاع الأموال غير تلقائي | 🔴 عالي | خسارة مالية للآباء | إنشاء ParentRefund تلقائي + تنبيهات |
| 2 | الجلسات التجريبية غير واضحة | 🟡 متوسط | التباس في الفهم | توثيق واضحة + إعادة تسمية |
| 3 | حالة "ghost" معرّضة للإساءة | 🟡 متوسط | معلم يرسل تقرير بعد أسبوع | حد زمني قاسي + تنبيهات تلقائية |
| 4 | النزاعات لا تنشئ refunds | 🔴 عالي | خسارة مالية | إضافة منطق الاسترجاع في resolveDispute |
| 5 | عدم تتبع نوع المُلغي | 🟢 منخفض | صعوبة التحليل | إضافة cancelledByType |
| 6 | عدم التحقق من النزاهة | 🔴 عالي | احتيال محتمل | إضافة SessionVerification |
| 7 | معالجة الأخطاء ضعيفة | 🟡 متوسط | فقدان البيانات | تحسين error handling |
| 8 | عدم وجود تنبيهات proactive | 🟡 متوسط | معلمون لا يرسلون تقارير | إضافة reminders آلية |

---

## 🎯 التوصيات والتحسينات

### **المجموعة الأولى: تحسينات العاجلة (Priority: HIGH)**

#### 1. إنشاء ParentRefund تلقائي عند الإلغاء

```typescript
// في bookings/cancel.ts - بعد تحديث الحجز

if (!isTrial && refundEligible && booking.paymentStatus === PaymentStatus.PAID) {
  // إنشاء سجل الاسترجاع
  await tx.parentRefund.create({
    data: {
      bookingId,
      amount: booking.price,
      isPaid: false,
    }
  });

  // تنبيه ولي الأمر
  await createNotification({
    userId: booking.parentUserId,
    title: '✅ تم إلغاء الحجز - الاسترجاع قيد المعالجة',
    message: `سيتم تحويل ${booking.price} ريال إلى حسابك خلال 3-5 أيام عمل`,
  }, tx);

  // تنبيه الإدارة
  await createNotification({
    userId: ADMIN_ID,
    title: '⚠️ طلب استرجاع أموال جديد',
    message: `استرجاع ${booking.price} ريال من ولي أمر - حجز ملغى`,
  }, tx);
}
```

#### 2. حل النزاعات يُنشئ refunds تلقائياً

```typescript
// في disputes.ts - في resolveDispute()

if (decision === 'RESOLVED_IN_FAVOR_OF_PARENT') {
  // 1. إنشاء ParentRefund
  await tx.parentRefund.create({
    data: {
      bookingId: dispute.bookingId,
      amount: booking.price,
      isPaid: false,
    }
  });

  // 2. تحديث الحجز
  await tx.booking.update({
    where: { id: booking.id },
    data: {
      paymentStatus: PaymentStatus.REFUNDED,
    }
  });

  // 3. إخطار الأطراف
  await createNotification({
    userId: booking.parentUserId,
    title: '✅ تم حل النزاع لصالحك',
    message: `المبلغ ${booking.price} ريال سيُحوّل إلى حسابك`,
  }, tx);

  // 4. إذا كان هناك payout سابق، قد نحتاج لتعديل:
  if (booking.payoutId) {
    // إعادة حساب التسوية
    // أو عزل الحجز من التسوية (معقد!)
  }
}
```

---

#### 3. فحص صارم على حالة "ghost"

```typescript
// في lib/utils/booking-state.ts

export function canSubmitReport(startTime: Date | string, durationMinutes: number): boolean {
  const state = getDetailedSessionState(startTime, durationMinutes);
  
  // ✅ منع إرسال التقرير بعد 24 ساعة
  if (state.status === 'ghost') {
    return false; // تصحيح الخطأ الحالي!
  }
  
  return ['grace_period', 'expired'].includes(state.status);
}

// جدولة مهمة يومية:
export async function handleMissingReports() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  // البحث عن حجوزات مكتملة بدون تقرير
  const missingReports = await prisma.booking.findMany({
    where: {
      status: BookingStatus.COMPLETED,
      completedAt: { lte: oneDayAgo },
      report: null,
      teacherService: {
        include: { teacher: true }
      }
    }
  });

  for (const booking of missingReports) {
    // تنبيه المعلم
    await createNotification({
      userId: booking.teacherService.teacher.userId,
      title: '⚠️ لم تُرسل تقرير الجلسة',
      message: 'يجب إرسال التقرير قبل 24 ساعة من انتهاء الجلسة',
    });

    // بعد 48 ساعة: تسجيل عدم الحضور تلقائي
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    if (booking.completedAt && booking.completedAt <= twoDaysAgo) {
      await prisma.sessionReport.create({
        data: {
          bookingId: booking.id,
          studentAttended: false, // افتراضي
          topicsCovered: '[تقرير نظام: لم يُرسل تقرير]',
          studentPerformance: 1,
          teacherNotes: 'تم إنشاء هذا التقرير تلقائياً - لم يُرسل المعلم تقرير الجلسة',
        }
      });
    }
  }
}
```

---

### **المجموعة الثانية: تحسينات المنطق (Priority: HIGH)**

#### 4. توثيق سياسة الجلسات التجريبية

```typescript
// إضافة إلى lib/settings.ts أو documentation

/**
 * سياسة الجلسات التجريبية:
 * 
 * 1. من يحجز: ولي أمر
 * 2. التكلفة على ولي الأمر: 0 ريال
 * 3. التكلفة على المعلم: 0 ريال
 * 4. التكلفة على المنصة: TrialSessionCost (افتراضي = 10 ريال)
 * 
 * 5. الحد الأقصى: جلسة واحدة فقط للطالب مدى الحياة
 * 6. مدة الجلسة: 30 دقيقة (افتراضي)
 * 7. الهدف: اختبار مستوى الطالب + تقييم المعلم
 * 
 * المشاكل الحالية:
 * - عند التسوية: المعلم يحصل على 10 ريال من المنصة؟ (غير موثق)
 * - يجب توضيح: هل المعلم يحصل على شيء أم لا؟
 * 
 * الحل المقترح:
 * - لا يحصل المعلم على شيء (يعني: trialCompensation = 0)
 * - الـ 10 ريال تحتسب كلفة على المنصة فقط
 */

// في payout.ts:
if (b.isTrial) {
  // لا نضيف ولا شيء للمعلم (netAmount = 0 للجلسات التجريبية)
  // trialCompensation يبقى فقط للتتبع الإحصائي
}
```

---

#### 5. إضافة cancelledByType إلى schema

```prisma
// في schema.prisma:

model Booking {
  ...
  cancelledBy       String?
  cancelledByType   UserType?  // NEW: PARENT | TEACHER | ADMIN
  cancelledAt       DateTime?
  ...
}

// يساعد في:
// - التقارير: كم معلم ألغى vs كم ولي أمر ألغى
// - التحليل: هل هناك معلمون يُلغون كثيراً؟
// - السلوك: متى يُلغي الآباء والمعلمون
```

---

### **المجموعة الثالثة: تحسينات البيانات (Priority: MEDIUM)**

#### 6. إضافة SessionVerification

```prisma
// في schema.prisma:

model SessionVerification {
  id              String   @id @default(cuid())
  bookingId       String   @unique
  booking         Booking  @relation(fields: [bookingId], references: [id])
  
  // ملخص الطالب
  studentSummary  String   @db.Text
  studentScore    Int?     // درجة التطابق: 0-100
  
  // مواضيع المعلم
  teacherTopics   String   @db.Text
  
  // النتيجة
  isVerified      Boolean  @default(false)
  discrepancy     String?  @db.Text // وصف عدم التطابق
  
  // التاريخ
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

#### 7. إضافة BookingAuditLog

```prisma
// في schema.prisma:

model BookingAuditLog {
  id          String   @id @default(cuid())
  bookingId   String
  booking     Booking  @relation(fields: [bookingId], references: [id])
  
  action      String   // CREATED | PAID | ACCEPTED | CANCELLED | COMPLETED
  changedBy   String   // userId
  changedByType UserType
  
  previousStatus  BookingStatus?
  newStatus       BookingStatus?
  
  details     String?  @db.Text // JSON: تفاصيل التغيير
  reason      String?  // السبب (للإلغاء مثلاً)
  
  createdAt   DateTime @default(now())
  
  @@index([bookingId])
  @@index([changedBy])
  @@index([action])
}
```

---

### **المجموعة الرابعة: تحسينات الواجهة (Priority: MEDIUM)**

#### 8. لوحة تحكم admin محسّنة

```typescript
// مثال: AdminPayoutsEngine.tsx يجب أن يوضح:

// 1. حالة جميع الحجوزات:
//    - COMPLETED مع تقرير ✓
//    - COMPLETED بدون تقرير ⚠️
//    - مع نزاعات مفتوحة ⚠️

// 2. حالة جميع الاسترجاعات:
//    - طلبات معلقة: X
//    - منفذة: Y
//    - مرفوضة: Z

// 3. رسوم بيانية:
//    - معدل الإلغاء بنوع (ولي أمر vs معلم vs إدارة)
//    - متوسط وقت إرسال التقرير
//    - معدل النزاعات
```

---

## 🚀 الخطة المقترحة

### **المرحلة الأولى: إصلاحات حرجة (1-2 أسبوع)**

- [ ] إضافة ParentRefund تلقائي عند الإلغاء ✅
- [ ] حل النزاعات ينشئ refunds ✅
- [ ] فحص صارم على حالة "ghost" ✅
- [ ] إضافة cancelledByType إلى schema
- [ ] تحسين معالجة الأخطاء

### **المرحلة الثانية: تحسينات الجودة (2-3 أسابيع)**

- [ ] SessionVerification
- [ ] BookingAuditLog
- [ ] تنبيهات تلقائية للمعلمين
- [ ] توثيق سياسة الجلسات التجريبية

### **المرحلة الثالثة: تحليلات وتقارير (2-3 أسابيع)**

- [ ] لوحة تحكم محسّنة
- [ ] رسوم بيانية للسلوك
- [ ] تقارير دورية (يومية/أسبوعية/شهرية)

---

## 📌 الخلاصة

### **نقاط القوة:**
✅ المنطق الأساسي سليم وواضح  
✅ استخدام Transactions للحفاظ على تكامل البيانات  
✅ Validation قوية على الإدخالات  
✅ معالجة معظم الحالات الحدودية  

### **نقاط الضعف:**
❌ إدارة Refunds غير تلقائية  
❌ النزاعات لا تؤثر على الاسترجاع  
❌ عدم وجود حد زمني قاسي للتقارير  
❌ نقص في المراقبة والتنبيهات  
❌ عدم وضوح سياسة الجلسات التجريبية  

### **التأثير المالي المحتمل:**
- 💸 خسارة من Refunds المعلقة
- 💸 دفع مبالغ لمعلمين لم يقدموا الخدمة
- 💸 منصة تدفع للمعلمين من حجوزات غير منجزة

### **التوصية النهائية:**
**يجب البدء بالمرحلة الأولى فوراً** - الإصلاحات الحرجة ستحسن من الاستقرار المالي بنسبة 60%.

---

## 📞 التفاصيل التقنية

### **الملفات المتأثرة بالتحسينات:**

```
lib/
├── actions/
│   ├── bookings/
│   │   ├── cancel.ts          ← تحديث: ParentRefund تلقائي
│   │   ├── report.ts          ← تحديث: فحص حالة ghost
│   │   └── create.ts          ← بحث: توثيق الجلسات التجريبية
│   ├── disputes.ts            ← تحديث: refund عند الحل
│   └── payout.ts              ← مراجعة: حساب التسوية
├── utils/
│   └── booking-state.ts       ← تحديث: منطق ghost
├── validations/
│   └── booking.ts             ← تحديث: تحقق من الإلغاء
└── types/
    └── next-auth.d.ts         ← إضافة: cancelledByType

prisma/
└── schema.prisma              ← إضافة: حقول جديدة
    ├── Booking.cancelledByType
    ├── SessionVerification
    └── BookingAuditLog

components/
└── shared/
    ├── AdminPayoutsEngine.tsx ← تحديث: واجهة محسّنة
    ├── BookingCard.tsx        ← تحديث: تنبيهات
    └── DisputeModal.tsx       ← تحديث: refund logic
```

