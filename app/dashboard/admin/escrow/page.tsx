import { UserType } from "@prisma/client";
import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { requireAuth } from "@/lib/require-auth";
import { getAllEscrows } from "@/lib/services/domain/admin-escrow-service";
import { formatPrice } from "@/lib/utils";
import { EscrowActions } from "./escrow-actions";

export default async function AdminEscrowPage() {
	await requireAuth([UserType.ADMIN]);

	const escrows = await getAllEscrows();

	const pendingEscrows = escrows.filter((e) => e.status === "PENDING");
	const resolvedEscrows = escrows.filter((e) => e.status !== "PENDING");

	return (
		<div className="space-y-6 text-right pb-10" dir="rtl">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-black flex items-center gap-2">
						<ShieldAlert className="h-7 w-7 text-red-500" />
						صندوق إدارة الأموال المجمدة
					</h1>
					<p className="text-muted-foreground mt-1">
						إدارة الأموال المصادرة بسبب عدم التزام المعلمين بكتابة التقارير.
					</p>
				</div>
			</div>

			{pendingEscrows.length === 0 && resolvedEscrows.length === 0 ? (
				<div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
					<CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4 opacity-50" />
					<p>الصندوق فارغ حالياً. لم يتم مصادرة أي جلسات.</p>
				</div>
			) : (
				<div className="grid gap-6">
					{pendingEscrows.length > 0 && (
						<div className="space-y-4">
							<h2 className="text-lg font-bold flex items-center gap-2 text-red-600">
								<AlertCircle className="h-5 w-5" />
								بانتظار القرار الإداري ({pendingEscrows.length})
							</h2>
							<div className="grid gap-4">
								{pendingEscrows.map((escrow) => (
									<div
										key={escrow.id}
										className="bg-white dark:bg-card border-2 border-red-200 dark:border-red-900/50 rounded-2xl p-5 shadow-sm"
									>
										<div className="flex flex-col md:flex-row gap-4 justify-between">
											<div>
												<div className="flex items-center gap-3 mb-2">
													<span className="font-bold text-lg text-red-600">
														{formatPrice(Number(escrow.amount))}
													</span>
													<span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-md">
														رصيد مجمد
													</span>
												</div>
												<div className="text-sm text-foreground space-y-1">
													<p>
														<span className="text-muted-foreground">
															المعلم:
														</span>{" "}
														<Link
															href={`/teachers/${escrow.booking.teacherService.teacher.slug}`}
															className="font-semibold text-primary hover:underline"
														>
															{escrow.booking.teacherService.teacher.user.name}
														</Link>
													</p>
													<p>
														<span className="text-muted-foreground">
															الطالب:
														</span>{" "}
														<span className="font-semibold">
															{escrow.booking.student.name}
														</span>
													</p>
													<p>
														<span className="text-muted-foreground">
															تاريخ الجلسة:
														</span>{" "}
														{new Date(
															escrow.booking.startTime,
														).toLocaleDateString("ar-EG")}
													</p>
													<p className="text-xs text-muted-foreground mt-2">
														السبب: {escrow.reason}
													</p>
												</div>
											</div>
											<div className="shrink-0 flex items-center">
												<EscrowActions escrowId={escrow.id} />
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{resolvedEscrows.length > 0 && (
						<div className="space-y-4 mt-8">
							<h2 className="text-lg font-bold text-muted-foreground">
								سجل القرارات السابقة ({resolvedEscrows.length})
							</h2>
							<div className="grid gap-4 opacity-75">
								{resolvedEscrows.map((escrow) => (
									<div
										key={escrow.id}
										className="bg-card border border-border rounded-xl p-4"
									>
										<div className="flex items-center justify-between">
											<div>
												<p className="font-bold">
													{escrow.booking.teacherService.teacher.user.name} -{" "}
													{escrow.booking.student.name}
												</p>
												<p className="text-sm text-muted-foreground mt-1">
													تم تحويل {formatPrice(Number(escrow.amount))} إلى:{" "}
													<span className="font-bold text-foreground">
														{escrow.status === "REFUNDED_TO_PARENT" &&
															"رصيد ولي الأمر"}
														{escrow.status === "PAID_TO_TEACHER" &&
															"حساب المعلم"}
														{escrow.status === "PLATFORM_PROFIT" &&
															"أرباح المنصة"}
													</span>
												</p>
											</div>
											<div className="text-xs text-muted-foreground text-left">
												<p>
													تم الحسم في:{" "}
													{escrow.resolvedAt?.toLocaleDateString("ar-EG")}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
