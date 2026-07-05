import { Currency } from "@prisma/client";

export type UnpaidBooking = {
	id: string;
	teacherId: string;
	teacherName: string;
	studentName: string;
	serviceName: string;
	startTime: Date;
	duration: number;
	price: number;
	isTrial: boolean;
	trialCostToPlatform: number;
	appliedCommissionRate: number;
	currency: Currency;
};

export type PayoutRecord = {
	id: string;
	totalAmount: number;
	commissionAmount: number;
	trialCompensation: number;
	netAmount: number;
	currency: Currency;
	isPaid: boolean;
	paidAt: Date | null;
	periodStart: Date;
	periodEnd: Date;
	createdAt: Date;
	teacher: {
		user: {
			name: string;
		};
	};
};

export type ParentRefundRecord = {
	id: string;
	bookingId: string;
	parentName: string;
	amount: number;
	currency: Currency;
	isPaid: boolean;
	paidAt: Date | null;
	createdAt: Date;
};
