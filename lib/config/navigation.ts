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
	{ href: "/dashboard/parent", label: "home", icon: LayoutDashboard },
	{ href: "/dashboard/parent/students", label: "manage_students", icon: Users },
	{ href: "/dashboard/parent/bookings", label: "my_bookings", icon: Calendar },
	{
		href: "/dashboard/parent/bookings/new",
		label: "new_booking",
		icon: CalendarPlus,
	},
	{ href: "/dashboard/parent/live", label: "quick_help", icon: Zap },
	{
		href: "/dashboard/parent/requests",
		label: "teacher_requests",
		icon: Briefcase,
	},
	{
		href: "/dashboard/parent/financials",
		label: "financial_record",
		icon: CreditCard,
	},
	{
		href: "/dashboard/parent/faq",
		label: "faq",
		icon: HelpCircle,
	},
];

export const teacherLinks = [
	{ href: "/dashboard/teacher", label: "home", icon: LayoutDashboard },
	{
		href: "/dashboard/teacher/profile",
		label: "edit_profile",
		icon: UserCheck,
	},
	{
		href: "/dashboard/teacher/services",
		label: "manage_services",
		icon: Briefcase,
	},
	{
		href: "/dashboard/teacher/availability",
		label: "weekly_availability",
		icon: Clock,
	},
	{
		href: "/dashboard/teacher/live",
		label: "live_radar",
		icon: CalendarPlus,
	},
	{
		href: "/dashboard/teacher/bookings",
		label: "incoming_bookings",
		icon: Calendar,
	},
	{
		href: "/dashboard/teacher/earnings",
		label: "earnings",
		icon: BadgeDollarSign,
	},
	{
		href: "/dashboard/teacher/verification",
		label: "upload_verification_docs",
		icon: FileCheck,
	},
	{
		href: "/dashboard/teacher/faq",
		label: "faq",
		icon: HelpCircle,
	},
];

export const adminLinks = [
	{ href: "/dashboard/admin", label: "home", icon: LayoutDashboard },
	{ href: "/dashboard/admin/users", label: "manage_users", icon: Users },
	{ href: "/dashboard/admin/teachers", label: "manage_teachers", icon: Users },
	{ href: "/dashboard/admin/bookings", label: "all_bookings", icon: Calendar },
	{
		href: "/dashboard/admin/disputes",
		label: "manage_disputes",
		icon: ShieldAlert,
	},
	{
		href: "/dashboard/admin/financials",
		label: "financial_management",
		icon: CreditCard,
	},
	{
		href: "/dashboard/admin/services",
		label: "manage_service_types",
		icon: Briefcase,
	},
	{
		href: "/dashboard/admin/settings",
		label: "system_settings",
		icon: Settings,
	},
	{
		href: "/dashboard/admin/settings/homepage",
		label: "homepage_settings",
		icon: Settings,
	},
	{
		href: "/dashboard/admin/verification",
		label: "verification_requests",
		icon: ShieldCheck,
	},
	{
		href: "/dashboard/admin/faq",
		label: "manage_faq",
		icon: HelpCircle,
	},
];
