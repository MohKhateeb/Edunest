import {
	BadgeDollarSign,
	Briefcase,
	Calendar,
	CalendarPlus,
	Clock,
	CreditCard,
	FileCheck,
	HelpCircle,
	LayoutDashboard,
	Settings,
	ShieldAlert,
	ShieldCheck,
	UserCheck,
	Users,
	Zap,
} from "lucide-react";

export const parentLinks = [
	{ href: "/dashboard/parent", label: "الرئيسية", icon: LayoutDashboard },
	{ href: "/dashboard/parent/students", label: "إدارة الطلاب", icon: Users },
	{ href: "/dashboard/parent/bookings", label: "حجوزاتي", icon: Calendar },
	{
		href: "/dashboard/parent/bookings/new",
		label: "حجز جلسة جديدة",
		icon: CalendarPlus,
	},
	{ href: "/dashboard/parent/live", label: "فزعة سريعة (أوبر) ⚡", icon: Zap },
	{
		href: "/dashboard/parent/requests",
		label: "طلبات المعلمين وعروضهم",
		icon: Briefcase,
	},
	{
		href: "/dashboard/parent/financials",
		label: "السجل المالي",
		icon: CreditCard,
	},
	{
		href: "/dashboard/parent/faq",
		label: "الأسئلة الشائعة",
		icon: HelpCircle,
	},
];

export const teacherLinks = [
	{ href: "/dashboard/teacher", label: "الرئيسية", icon: LayoutDashboard },
	{
		href: "/dashboard/teacher/profile",
		label: "تعديل الملف الشخصي",
		icon: UserCheck,
	},
	{
		href: "/dashboard/teacher/services",
		label: "إدارة الخدمات",
		icon: Briefcase,
	},
	{
		href: "/dashboard/teacher/availability",
		label: "أوقات التوفر الأسبوعية",
		icon: Clock,
	},
	{
		href: "/dashboard/teacher/live",
		label: "الرادار الحي 📡",
		icon: CalendarPlus,
	},
	{
		href: "/dashboard/teacher/bookings",
		label: "الحجوزات الواردة",
		icon: Calendar,
	},
	{
		href: "/dashboard/teacher/earnings",
		label: "الأرباح والتسويات",
		icon: BadgeDollarSign,
	},
	{
		href: "/dashboard/teacher/verification",
		label: "رفع وثائق التوثيق",
		icon: FileCheck,
	},
	{
		href: "/dashboard/teacher/faq",
		label: "الأسئلة الشائعة",
		icon: HelpCircle,
	},
];

export const adminLinks = [
	{ href: "/dashboard/admin", label: "الرئيسية", icon: LayoutDashboard },
	{ href: "/dashboard/admin/users", label: "إدارة المستخدمين", icon: Users },
	{ href: "/dashboard/admin/teachers", label: "إدارة المعلمين", icon: Users },
	{ href: "/dashboard/admin/bookings", label: "كل الحجوزات", icon: Calendar },
	{
		href: "/dashboard/admin/disputes",
		label: "إدارة النزاعات",
		icon: ShieldAlert,
	},
	{
		href: "/dashboard/admin/financials",
		label: "الإدارة المالية الشاملة",
		icon: CreditCard,
	},
	{
		href: "/dashboard/admin/services",
		label: "إدارة أنواع الخدمات",
		icon: Briefcase,
	},
	{
		href: "/dashboard/admin/settings",
		label: "إعدادات النظام",
		icon: Settings,
	},
	{
		href: "/dashboard/admin/settings/homepage",
		label: "إعدادات الصفحة الرئيسية",
		icon: Settings,
	},
	{
		href: "/dashboard/admin/verification",
		label: "طلبات التوثيق",
		icon: ShieldCheck,
	},
	{
		href: "/dashboard/admin/faq",
		label: "إدارة الأسئلة الشائعة",
		icon: HelpCircle,
	},
];
