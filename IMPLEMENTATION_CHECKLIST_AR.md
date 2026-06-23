# ✅ قائمة التحقق - Implementation Checklist

## 📋 المرحلة الأولى: إصلاحات حرجة

### ✅ الإصلاح #1: ParentRefund تلقائي عند الإلغاء

**الملف:** `lib/actions/bookings/cancel.ts`

- [ ] نسخ الكود الجديد من `IMPLEMENTATION_CODE_AR.md`
- [ ] إضافة حقل `cancelledByType` إلى الكود
- [ ] اختبار إلغاء الحجز من ولي أمر
  - [ ] التحقق من إنشاء `ParentRefund`
  - [ ] التحقق من الإشعارات
  - [ ] التحقق من قاعدة البيانات
- [ ] اختبار إلغاء الحجز من معلم
  - [ ] التحقق من الاسترجاع الفوري
- [ ] اختبار إلغاء الحجز من إدارة
  - [ ] التحقق من الاسترجاع الفوري
- [ ] اختبار حالة عدم الاسترجاع (متأخر جداً)
  - [ ] التحقق من عدم إنشاء `ParentRefund`
  - [ ] التحقق من رسالة الخطأ
- [ ] اختبار حد الاسترجاعات (2 فقط)
  - [ ] محاولة 3 مرات يجب أن تفشل

**نقاط الفحص:**
```
✓ Booking.status = CANCELLED
✓ Booking.cancellationReason = محفوظ
✓ ParentRefund.isPaid = false (ينتظر الإدارة)
✓ Notification للآباء واضحة
✓ Notification للإدارة موجودة
✓ User.refundRequestsCount += 1
```

---

### ✅ الإصلاح #2: حل النزاعات ينشئ refunds

**الملف:** `lib/actions/disputes.ts`

- [ ] نسخ الكود الجديد من `IMPLEMENTATION_CODE_AR.md`
- [ ] اختبار حل نزاع لصالح الولي
  - [ ] التحقق من إنشاء `ParentRefund`
  - [ ] التحقق من تحديث `Booking.paymentStatus` = REFUNDED
  - [ ] التحقق من الإشعارات للآباء والمعلمين
- [ ] اختبار حل نزاع لصالح المعلم
  - [ ] التحقق من عدم إنشاء `ParentRefund`
  - [ ] التحقق من الإشعارات المناسبة
- [ ] اختبار إعادة فتح نزاع مغلق
  - [ ] يجب أن يفشل

**نقاط الفحص:**
```
✓ Dispute.status = RESOLVED_IN_FAVOR_OF_PARENT/TEACHER
✓ Dispute.adminNotes = محفوظة
✓ ParentRefund (إن أمنت) = isPaid: false
✓ Notification لجميع الأطراف
✓ Booking.paymentStatus = REFUNDED (إن لزم)
```

---

### ✅ الإصلاح #3: فحص صارم على حالة "ghost"

**الملف:** `lib/utils/booking-state.ts` + جدولة مهام

- [ ] تحديث `canSubmitReport()` لمنع "ghost"
- [ ] اختبار إرسال تقرير في الوقت المناسب
  - [ ] يجب أن ينجح
- [ ] اختبار إرسال تقرير متأخر (بعد 24 ساعة)
  - [ ] يجب أن يفشل
- [ ] إضافة دالة `handleMissingReports()` (جدولة يومية)
- [ ] اختبار تنبيه المعلم (بعد 23 ساعة)
  - [ ] يجب أن يستقبل إشعار
- [ ] اختبار إنشاء تقرير افتراضي (بعد 24 ساعة)
  - [ ] يجب أن ينشأ `SessionReport` تلقائي
  - [ ] يجب أن تُرسل الإشعارات
- [ ] جدولة المهمة اليومية
  - [ ] استخدم `node-cron` أو `bull`
  - [ ] استدعي `handleMissingReports()` يومياً الساعة 2 صباحاً

**نقاط الفحص:**
```
✓ getDetailedSessionState() يعود "ghost" بعد 24 ساعة
✓ canSubmitReport() يعود FALSE لـ "ghost"
✓ تنبيه المعلم (23 ساعة) مُرسل
✓ SessionReport افتراضي مُنشأ (24+ ساعة)
✓ Booking.status = COMPLETED (لا يتغير)
✓ Teacher.totalSessions لا يزيد (تقرير افتراضي)
```

---

### ✅ الإصلاح #4: إضافة cancelledByType إلى Schema

**الملفات:** `prisma/schema.prisma` + `lib/actions/bookings/cancel.ts`

- [ ] إضافة `cancelledByType?: UserType` إلى `Booking` في schema
- [ ] إضافة فهرس `@@index([cancelledByType])`
- [ ] إنشاء هجرة جديدة:
  ```bash
  npx prisma migrate dev --name add_cancelled_by_type
  ```
- [ ] تحديث `cancel.ts` لحفظ `cancelledByType`
- [ ] اختبار حفظ النوع
  - [ ] من ولي أمر: يجب أن يكون PARENT
  - [ ] من معلم: يجب أن يكون TEACHER
  - [ ] من إدارة: يجب أن يكون ADMIN

**نقاط الفحص:**
```
✓ Booking.cancelledByType = UserType (محفوظ)
✓ الفهرس موجود في قاعدة البيانات
✓ الهجرة نفذت بنجاح
```

---

### ✅ الإصلاح #5: تحسين معالجة الأخطاء

**الملف:** `lib/actions/bookings/report.ts`

- [ ] تحديث معالجة الأخطاء
- [ ] فحص وجود تقرير سابق (منع التكرار)
- [ ] رسائل خطأ واضحة حسب الحالة الزمنية
- [ ] اختبار الحالات:
  - [ ] تقرير قبل انتهاء الجلسة: يجب أن يفشل
  - [ ] تقرير أثناء الجلسة: يجب أن يفشل
  - [ ] تقرير بعد 30 دقيقة: يجب أن ينجح
  - [ ] تقرير بعد 24 ساعة: يجب أن يفشل

**نقاط الفحص:**
```
✓ SessionReport.bookingId @unique (لا يوجد تكرار)
✓ رسالة خطأ واضحة لكل حالة
✓ Booking.status = COMPLETED (صحيح)
✓ Teacher.totalSessions += 1 (صحيح)
```

---

## 🔄 اختبار السيناريوهات الكاملة

### **السيناريو #1: الحجز المثالي - النسخة السعيدة**

```
البيانات الأولية:
- Parent: معروف
- Student: نشط وتابع للـ parent
- Teacher: موثق
- Service: نشط وسعر معروف

الخطوات:
1. ولي أمر يحجز ← CREATE Booking (PENDING, UNPAID)
2. ولي أمر يدفع ← UPDATE Booking (PAID)
3. معلم يقبل ← UPDATE Booking (CONFIRMED)
4. جلسة تنتهي ← (انتظار)
5. معلم يرسل تقرير ← CREATE SessionReport, UPDATE Booking (COMPLETED)

التحقق:
✓ Booking.status progression: PENDING → CONFIRMED → COMPLETED
✓ Booking.paymentStatus: UNPAID → PAID
✓ SessionReport موجود
✓ Teacher.totalSessions += 1
✓ Notification لجميع الأطراف
```

---

### **السيناريو #2: الإلغاء المبكر - استرجاع أموال**

```
البيانات الأولية:
- Booking: PENDING, PAID (ولي أمر دفع)
- TimeLeft: 30 ساعة

الخطوات:
1. ولي أمر ينقر "إلغاء"
2. السبب: "تغير البرنامج"

التحقق:
✓ Booking.status = CANCELLED
✓ Booking.paymentStatus = REFUNDED
✓ ParentRefund محدث: isPaid = false
✓ User.refundRequestsCount += 1
✓ Notification للآباء واضحة
✓ Notification للإدارة موجودة
```

---

### **السيناريو #3: النزاع - الحل لصالح الولي**

```
البيانات الأولية:
- Booking: COMPLETED, PAID
- Time: بعد الانتهاء بـ 2 ساعة

الخطوات:
1. ولي أمر يفتح نزاع: "المعلم لم يقدم الخدمة"
2. إدارة تتحقق وتحل: "RESOLVED_IN_FAVOR_OF_PARENT"

التحقق:
✓ Dispute.status = RESOLVED_IN_FAVOR_OF_PARENT
✓ ParentRefund محدث: amount = booking.price, isPaid = false
✓ Booking.paymentStatus = REFUNDED
✓ Notification للآباء واضحة
✓ Notification للمعلم واضحة
```

---

### **السيناريو #4: التقرير المتأخر - العقوبة**

```
البيانات الأولية:
- Booking: CONFIRMED (الجلسة انتهت)
- Time: 25 ساعة بعد الانتهاء

الخطوات:
1. المعلم يحاول إرسال تقرير
2. يجب أن يفشل: "انتهت فترة السماح"

التحقق:
✓ canSubmitReport() = FALSE
✓ SessionReport لم ينشأ
✓ Booking.status = COMPLETED (بدون تقرير)
✓ في Payout: هذا الحجز لا يُدخل (بدون تقرير)
```

---

### **السيناريو #5: جلسة تجريبية**

```
البيانات الأولية:
- Student: لم يستخدم جلسة تجريبية قبل
- isTrial: true

الخطوات:
1. ولي أمر يحجز (بدون دفع)
2. معلم يقبل (بدون فحص دفع)
3. تقديم الخدمة والتقرير

التحقق:
✓ Booking.price = 0
✓ Booking.paymentStatus = UNPAID (لا يوجد دفع)
✓ Student لا يستطيع حجز تجريبية أخرى
```

---

## 🗂️ تحديث قاعدة البيانات

### **الهجرات المطلوبة:**

```bash
# 1. إضافة cancelledByType
npx prisma migrate dev --name add_cancelled_by_type

# 2. التحقق من الهجرة
npx prisma migrate status

# 3. في الإنتاج:
npx prisma migrate deploy
```

---

## 📊 الاختبار الآلي

### **ملفات الاختبار المقترحة:**

```typescript
// __tests__/booking-flow.test.ts

describe('Booking Flow', () => {
  describe('Cancellation with Refund', () => {
    it('should create ParentRefund when parent cancels', async () => {
      // ...
    });
    
    it('should not refund if cancel is too late', async () => {
      // ...
    });
  });
  
  describe('Dispute Resolution', () => {
    it('should create refund when resolved in favor of parent', async () => {
      // ...
    });
  });
  
  describe('Late Report', () => {
    it('should prevent report submission after 24 hours', async () => {
      // ...
    });
    
    it('should create default report after 24 hours', async () => {
      // ...
    });
  });
});
```

---

## 🚀 خطة النشر

### **قبل النشر:**

- [ ] اختبار محلي شامل (5 سيناريوهات)
- [ ] مراجعة الكود (code review)
- [ ] نسخ احتياطي من قاعدة البيانات
- [ ] إعداد خطة التراجع (rollback plan)

### **أثناء النشر:**

- [ ] تطبيق الهجرات: `npx prisma migrate deploy`
- [ ] نشر الكود الجديد
- [ ] تحديث الإعدادات (إن لزم)
- [ ] فحص السجلات (logs)

### **بعد النشر:**

- [ ] مراقبة الأخطاء (error tracking)
- [ ] فحص الإشعارات
- [ ] تتبع `ParentRefund` المعلقة
- [ ] تتبع النزاعات المفتوحة

---

## 📋 المتطلبات الإضافية

### **البيئة:**

- [ ] Node.js 18+
- [ ] Prisma 5+
- [ ] PostgreSQL 14+
- [ ] Redis (للمهام الجدولية - اختياري)

### **الخدمات:**

- [ ] بوابة الدفع (Stripe/PayPal) - اختبار
- [ ] خدمة البريد الإلكتروني - اختبار
- [ ] تسجيل السجلات (logging) - فعّال

### **الإعدادات:**

```env
# .env أو .env.local

# المهام الجدولية
CRON_ENABLED=true
CRON_MISSING_REPORTS="0 2 * * *"  # يومياً الساعة 2 صباحاً

# الحدود الزمنية
BOOKING_MIN_LEAD_HOURS=2
CANCELLATION_REFUND_HOURS=24
REPORT_SUBMISSION_GRACE_HOURS=0.5  # 30 دقيقة
MAX_REFUND_REQUESTS=2

# القيم المالية
TRIAL_SESSION_COST=10
COMMISSION_RATE=30  # في المائة
```

---

## ✅ قائمة النهائي

### **قبل الإطلاق:**

- [ ] جميع الاختبارات تمرت
- [ ] السجلات واضحة (لا توجد أخطاء)
- [ ] الإشعارات صحيحة
- [ ] الأداء مقبول
- [ ] التوثيق محدّث

### **بعد الإطلاق (الأسبوع الأول):**

- [ ] مراقبة `ParentRefund` المعلقة
- [ ] تتبع النزاعات المفتوحة
- [ ] فحص شكاوى المستخدمين
- [ ] مراجعة السجلات يومياً

---

## 📞 الدعم والمساعدة

### **إذا واجهت مشاكل:**

1. **خطأ في الهجرة:**
   ```bash
   npx prisma migrate resolve --rolled-back migration_name
   ```

2. **إرجاع للإصدار السابق:**
   ```bash
   git revert <commit-hash>
   npx prisma migrate deploy
   ```

3. **فحص قاعدة البيانات:**
   ```bash
   npx prisma studio
   ```

---

## 🎉 النتيجة المتوقعة

بعد تطبيق جميع الإصلاحات:

✅ استرجاع أموال آمن ومضمون  
✅ عدالة مالية في النزاعات  
✅ حماية من الاحتيال  
✅ ثقة أعلى من الآباء والمعلمين  
✅ عمليات أكثر وضوحاً وشفافية  

---

**تاريخ البدء:** [أدخل التاريخ]  
**الحالة:** ⏳ في الانتظار

