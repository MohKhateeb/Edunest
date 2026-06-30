import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AccountStatusBanner() {
	return (
		<div className="bg-card border border-border rounded-xl p-8 text-center max-w-md mx-auto space-y-4">
			<AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
			<h2 className="text-xl font-bold">حساب غير مكتمل</h2>
			<p className="text-muted-foreground text-sm">
				يبدو أن ملفك كمعلم غير مكتمل بعد. يرجى إكمال إعداد ملفك الشخصي لتتمكن من الوصول إلى لوحة القيادة واستقبال طلبات الحجز.
			</p>
			<Link
				href="/dashboard/teacher/profile"
				className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm"
			>
				أكمل ملفك الشخصي
			</Link>
		</div>
	);
}
