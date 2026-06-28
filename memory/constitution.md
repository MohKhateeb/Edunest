# Constitution

## Architecture & Code Quality
- يُمنع منعاً باتاً استدعاء prisma مباشرة في أي Server Action (داخل lib/actions) ويجب أن تمر جميع الاستعلامات عبر طبقة الـ Repository و UnitOfWork.
