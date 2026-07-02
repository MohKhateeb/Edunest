"use client";

import { CreditCard, Clock, Star, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatTimeOnly } from "@/lib/utils/time";
import type { DetailedBooking } from "@/lib/types";

type ActionType = "PAYMENT" | "APPROVAL" | "REVIEW";

interface UrgentAction {
	type: ActionType;
	booking: DetailedBooking;
	message: string;
	dueDate?: Date;
}

interface ActionCenterProps {
	actions: UrgentAction[];
}

export default function ActionCenter({ actions }: ActionCenterProps) {
	if (!actions || actions.length === 0) return null;

	const getActionConfig = (type: ActionType) => {
		switch (type) {
			case "PAYMENT":
				return {
					icon: <CreditCard className="w-5 h-5 text-white" />,
					bgClass: "bg-gradient-to-r from-orange-500 to-amber-500",
					badgeClass: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
					buttonClass: "bg-orange-600 hover:bg-orange-700 text-white",
					buttonText: "ادفع الآن",
					href: (bookingId: string) => `/dashboard/parent/financials?pay=${bookingId}`,
				};
			case "APPROVAL":
				return {
					icon: <Clock className="w-5 h-5 text-white" />,
					bgClass: "bg-gradient-to-r from-blue-500 to-indigo-500",
					badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
					buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
					buttonText: "مراجعة الطلب",
					href: (bookingId: string) => `/dashboard/parent/requests?booking=${bookingId}`,
				};
			case "REVIEW":
				return {
					icon: <Star className="w-5 h-5 text-white" />,
					bgClass: "bg-gradient-to-r from-emerald-500 to-teal-500",
					badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
					buttonClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
					buttonText: "قيّم الجلسة",
					href: (bookingId: string) => `/dashboard/parent/bookings/${bookingId}/review`,
				};
			default:
				return {
					icon: <AlertCircle className="w-5 h-5 text-white" />,
					bgClass: "bg-slate-500",
					badgeClass: "bg-slate-100 text-slate-800",
					buttonClass: "bg-slate-600 hover:bg-slate-700 text-white",
					buttonText: "عرض التفاصيل",
					href: (bookingId: string) => `/dashboard/parent/bookings/${bookingId}`,
				};
		}
	};

	return (
		<div className="space-y-4 w-full">
			<div className="flex items-center gap-2 mb-2">
				<div className="relative flex h-3 w-3">
					<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
					<span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
				</div>
				<h2 className="text-xl font-black text-slate-900 dark:text-white">أشياء بسيطة تحتاج لمستك لاستكمالها ✨</h2>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{actions.map((action, index) => {
					const config = getActionConfig(action.type);
					
					return (
						<div 
							key={index} 
							className="relative overflow-hidden bg-white dark:bg-slate-900 border border-border/60 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group"
						>
							<div className="flex items-start gap-4">
								<div className={`p-3 rounded-2xl ${config.bgClass} shadow-inner flex-shrink-0`}>
									{config.icon}
								</div>
								
								<div className="flex-1 space-y-2">
									<div className="flex items-center justify-between">
										<span className={`text-xs font-bold px-2 py-1 rounded-full ${config.badgeClass}`}>
											{action.type === "PAYMENT" && "بانتظار الدفع"}
											{action.type === "APPROVAL" && "بانتظار الموافقة"}
											{action.type === "REVIEW" && "التقييم مطلوب"}
										</span>
										{action.dueDate && (
											<span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
												<Clock className="w-3 h-3" />
												{formatTimeOnly(action.dueDate)}
											</span>
										)}
									</div>
									
									<p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
										{action.message}
									</p>
									
									<div className="pt-2">
										<Link 
											href={config.href(action.booking.id)}
											className={`inline-flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors ${config.buttonClass}`}
										>
											{config.buttonText}
											<ArrowLeft className="w-4 h-4" />
										</Link>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
