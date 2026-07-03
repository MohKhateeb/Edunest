const fs = require('fs');

const parentKeys = {
  'الرئيسية': 'home',
  'إدارة الطلاب': 'manage_students',
  'حجوزاتي': 'my_bookings',
  'حجز جلسة جديدة': 'new_booking',
  'فزعة سريعة (أوبر) ⚡': 'quick_help',
  'طلبات المعلمين وعروضهم': 'teacher_requests',
  'السجل المالي': 'financial_record',
  'الأسئلة الشائعة': 'faq'
};

const teacherKeys = {
  'الرئيسية': 'home',
  'تعديل الملف الشخصي': 'edit_profile',
  'إدارة الخدمات': 'manage_services',
  'أوقات التوفر الأسبوعية': 'weekly_availability',
  'الرادار الحي 📡': 'live_radar',
  'الحجوزات الواردة': 'incoming_bookings',
  'الأرباح والتسويات': 'earnings',
  'رفع وثائق التوثيق': 'upload_verification_docs',
  'الأسئلة الشائعة': 'faq'
};

const adminKeys = {
  'الرئيسية': 'home',
  'إدارة المستخدمين': 'manage_users',
  'إدارة المعلمين': 'manage_teachers',
  'كل الحجوزات': 'all_bookings',
  'إدارة النزاعات': 'manage_disputes',
  'الإدارة المالية الشاملة': 'financial_management',
  'إدارة أنواع الخدمات': 'manage_service_types',
  'إعدادات النظام': 'system_settings',
  'إعدادات الصفحة الرئيسية': 'homepage_settings',
  'طلبات التوثيق': 'verification_requests',
  'إدارة الأسئلة الشائعة': 'manage_faq'
};

let navCode = fs.readFileSync('lib/config/navigation.ts', 'utf8');
const allKeys = { ...parentKeys, ...teacherKeys, ...adminKeys };

for (const [arText, key] of Object.entries(allKeys)) {
  const safeText = arText.replace(/([()?⚡📡])/g, '\\$1');
  navCode = navCode.replace(new RegExp('label: "' + safeText + '"', 'g'), 'label: "' + key + '"');
}
fs.writeFileSync('lib/config/navigation.ts', navCode);

let arJson = JSON.parse(fs.readFileSync('messages/ar.json'));
if (!arJson.nav) arJson.nav = {};
for (const [arText, key] of Object.entries(allKeys)) {
  arJson.nav[key] = arText;
}
fs.writeFileSync('messages/ar.json', JSON.stringify(arJson, null, 2));

let enJson = JSON.parse(fs.readFileSync('messages/en.json'));
if (!enJson.nav) enJson.nav = {};
const enTranslations = {
  home: 'Home',
  manage_students: 'Manage Students',
  my_bookings: 'My Bookings',
  new_booking: 'New Booking',
  quick_help: 'Quick Help (Uber) ⚡',
  teacher_requests: 'Teacher Requests',
  financial_record: 'Financial Record',
  faq: 'FAQ',
  edit_profile: 'Edit Profile',
  manage_services: 'Manage Services',
  weekly_availability: 'Weekly Availability',
  live_radar: 'Live Radar 📡',
  incoming_bookings: 'Incoming Bookings',
  earnings: 'Earnings & Settlements',
  upload_verification_docs: 'Upload Verification Docs',
  manage_users: 'Manage Users',
  manage_teachers: 'Manage Teachers',
  all_bookings: 'All Bookings',
  manage_disputes: 'Manage Disputes',
  financial_management: 'Financial Management',
  manage_service_types: 'Manage Service Types',
  system_settings: 'System Settings',
  homepage_settings: 'Homepage Settings',
  verification_requests: 'Verification Requests',
  manage_faq: 'Manage FAQ'
};
for (const [key, enText] of Object.entries(enTranslations)) {
  enJson.nav[key] = enText;
}
fs.writeFileSync('messages/en.json', JSON.stringify(enJson, null, 2));
console.log('Done!');
