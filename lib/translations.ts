import type {
	BookingStatus,
	PaymentMethod,
	PaymentStatus,
	UserType,
	VerificationLevel,
} from "@prisma/client";

export const BOOKING_STATUS_AR: Record<BookingStatus, string> = {
	PENDING: "قيد الانتظار",
	CONFIRMED: "مؤكد",
	COMPLETED: "مكتمل",
	REJECTED: "مرفوض",
	CANCELLED: "ملغى",
};

export const PAYMENT_STATUS_AR: Record<PaymentStatus, string> = {
	UNPAID: "غير مدفوع",
	PAID: "مدفوع",
	REFUNDED: "مُسترد",
};

export const VERIFICATION_BADGES_CONFIG: Record<
	VerificationLevel,
	{ label: string; colorClass: string; icon: string }
> = {
	NONE: {
		label: "غير موثق",
		colorClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
		icon: "",
	},
	BRONZE: {
		label: "برونزي",
		colorClass: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
		icon: "🥉",
	},
	SILVER: {
		label: "فضي",
		colorClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
		icon: "🥈",
	},
	GOLD: {
		label: "ذهبي",
		colorClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
		icon: "🥇",
	},
};

export const USER_TYPE_AR: Record<UserType, string> = {
	PARENT: "ولي أمر",
	TEACHER: "معلم",
	ADMIN: "مدير النظام",
};

export const PAYMENT_METHOD_AR: Record<PaymentMethod, string> = {
	ONLINE_CARD: "بطاقة إلكترونية",
};

export const DAYS_OF_WEEK_AR: Record<number, string> = {
	0: "الأحد",
	1: "الاثنين",
	2: "الثلاثاء",
	3: "الأربعاء",
	4: "الخميس",
	5: "الجمعة",
	6: "السبت",
};

export const BOOKING_STATUS_STYLES: Record<string, string> = {
	PENDING:
		"bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900",
	CONFIRMED:
		"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
	COMPLETED:
		"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
	REJECTED:
		"bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900",
	CANCELLED:
		"bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
};

export const PAYMENT_STATUS_STYLES: Record<string, string> = {
	UNPAID: "text-rose-600 dark:text-rose-400",
	PENDING_VERIFICATION: "text-indigo-600 dark:text-indigo-400",
	PAID: "text-emerald-600 dark:text-emerald-400 font-bold",
	REFUNDED: "text-slate-500 dark:text-slate-400 line-through",
};

export const SERVICES = {
	QUICK_HELP: "شرح مسألة سريعة",
	MONTHLY_PACKAGE: "الحقيبة الشهرية",
} as const;
