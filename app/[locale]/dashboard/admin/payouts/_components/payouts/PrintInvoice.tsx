import { formatPrice } from "@/lib/utils";
import type { PayoutRecord } from "@/types/payout";

type PrintInvoiceProps = {
	payoutToPrint: PayoutRecord;
};

export function PrintInvoice({ payoutToPrint }: PrintInvoiceProps) {
	return (
		<div className="hidden print:block absolute inset-0 bg-white z-[9999] p-10 text-black min-h-screen">
			<div className="flex justify-between items-center border-b-2 border-gray-300 pb-6 mb-8">
				<div>
					<h1 className="text-3xl font-extrabold text-gray-800">EduNest</h1>
					<p className="text-sm text-gray-500 mt-1">منصة التعليم الرائدة</p>
				</div>
				<div className="text-left">
					<h2 className="text-2xl font-bold text-gray-700">
						فاتورة تسوية مستحقات
					</h2>
					<p className="text-sm font-medium text-gray-500 mt-2">
						التاريخ: {new Date().toLocaleDateString("ar-EG")}
					</p>
					<p className="text-sm font-medium text-gray-500">
						رقم الفاتورة: {payoutToPrint.id.slice(-8).toUpperCase()}
					</p>
				</div>
			</div>

			<div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
				<h3 className="text-lg font-bold mb-4 border-b border-gray-200 pb-2">
					معلومات المستفيد
				</h3>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-sm text-gray-500 mb-1">الاسم</p>
						<p className="font-bold text-gray-800 text-lg">
							{payoutToPrint.teacher.user.name}
						</p>
					</div>
					<div>
						<p className="text-sm text-gray-500 mb-1">فترة التسوية</p>
						<p className="font-bold text-gray-800 text-lg">
							{new Date(payoutToPrint.periodStart).toLocaleDateString("ar-EG")}{" "}
							- {new Date(payoutToPrint.periodEnd).toLocaleDateString("ar-EG")}
						</p>
					</div>
				</div>
			</div>

			<table className="w-full text-right border-collapse mb-8 border border-gray-300">
				<thead>
					<tr className="bg-gray-100">
						<th className="p-4 border-b border-gray-300 font-bold text-gray-700">
							البيان
						</th>
						<th className="p-4 border-b border-gray-300 font-bold text-left text-gray-700">
							المبلغ
						</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td className="p-4 border-b border-gray-200 text-gray-800">
							إجمالي رسوم الحصص الخصوصية
						</td>
						<td className="p-4 border-b border-gray-200 text-left font-semibold text-gray-800">
							{formatPrice(payoutToPrint.totalAmount)}
						</td>
					</tr>
					<tr>
						<td className="p-4 border-b border-gray-200 text-gray-800">
							عمولة المنصة (مخصومة)
						</td>
						<td className="p-4 border-b border-gray-200 text-left font-semibold text-red-600">
							-{formatPrice(payoutToPrint.commissionAmount)}
						</td>
					</tr>
					{payoutToPrint.trialCompensation > 0 && (
						<tr>
							<td className="p-4 border-b border-gray-200 text-gray-800">
								تعويضات الحصص المجانية (مضافة)
							</td>
							<td className="p-4 border-b border-gray-200 text-left font-semibold text-green-600">
								+{formatPrice(payoutToPrint.trialCompensation)}
							</td>
						</tr>
					)}
				</tbody>
				<tfoot>
					<tr className="bg-gray-50">
						<td className="p-5 font-extrabold text-xl text-gray-900 border-t-2 border-gray-300">
							الصافي المستحق للتحويل
						</td>
						<td className="p-5 font-extrabold text-xl text-left text-gray-900 border-t-2 border-gray-300">
							{formatPrice(payoutToPrint.netAmount)}
						</td>
					</tr>
				</tfoot>
			</table>

			<div className="text-center mt-20 text-gray-500 text-sm">
				<p>
					هذه الفاتورة مصدرة إلكترونياً من نظام EduNest ولا تحتاج إلى توقيع يدوي.
				</p>
				<p className="mt-2">شكراً لجهودكم المستمرة في إثراء المحتوى التعليمي.</p>
			</div>
		</div>
	);
}
