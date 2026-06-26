"use client";

import type { DisputeStatus, DisputeTurn, UserType } from "@prisma/client";
import { GraduationCap, Info, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
	changeDisputeTurn,
	resolveDispute,
	sendDisputeMessage,
} from "@/lib/actions/disputes";

type Message = {
	id: string;
	senderId: string;
	sender: { name: string; userType: string };
	message: string;
	createdAt: Date;
};

type DisputeChatProps = {
	disputeId: string;
	status: DisputeStatus;
	allowedTurn: DisputeTurn;
	messages: Message[];
	currentUserId: string;
	currentUserType: UserType;
};

export function DisputeChat({
	disputeId,
	status,
	allowedTurn,
	messages,
	currentUserId,
	currentUserType,
}: DisputeChatProps) {
	const [msgText, setMsgText] = useState("");
	const [loading, setLoading] = useState(false);
	const [resolving, setResolving] = useState(false);
	const [adminNotes, setAdminNotes] = useState("");
	const router = useRouter();
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!msgText.trim()) return;

		setLoading(true);
		const res = await sendDisputeMessage({ disputeId, message: msgText });
		if (res.success) {
			setMsgText("");
			router.refresh();
		} else {
			alert(res.error);
		}
		setLoading(false);
	};

	const handleResolve = async (
		decision: "RESOLVED_IN_FAVOR_OF_PARENT" | "RESOLVED_IN_FAVOR_OF_TEACHER",
	) => {
		if (!confirm("هل أنت متأكد من قرارك؟ لا يمكن التراجع بعد الإغلاق.")) return;

		setResolving(true);
		const res = await resolveDispute({ disputeId, decision, adminNotes });
		if (res.success) {
			router.refresh();
		} else {
			alert(res.error);
		}
		setResolving(false);
	};

	const handleTurnChange = async (turn: DisputeTurn) => {
		setLoading(true);
		const res = await changeDisputeTurn(disputeId, turn);
		if (res.success) {
			router.refresh();
		} else {
			alert(res.error);
		}
		setLoading(false);
	};

	const canSend =
		currentUserType === "ADMIN" ||
		allowedTurn === "BOTH" ||
		(allowedTurn === "PARENT" && currentUserType === "PARENT") ||
		(allowedTurn === "TEACHER" && currentUserType === "TEACHER");

	const getTurnMessage = () => {
		if (currentUserType === "ADMIN") return "";
		if (allowedTurn === "NONE") return "المحادثة مقفلة مؤقتاً من قبل الإدارة.";
		if (allowedTurn === "PARENT" && currentUserType === "TEACHER")
			return "الإدارة بانتظار رد ولي الأمر حالياً. لا يمكنك الإرسال.";
		if (allowedTurn === "TEACHER" && currentUserType === "PARENT")
			return "الإدارة بانتظار رد المعلم حالياً. لا يمكنك الإرسال.";
		return "";
	};

	return (
		<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[70vh]">
			{/* Chat Header */}
			<div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/80 flex justify-between items-center shrink-0">
				<div>
					<h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
						محادثة النزاع
						{status === "OPEN" ? (
							<span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
								مفتوح
							</span>
						) : (
							<span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full flex items-center gap-1">
								<svg
									className="w-3 h-3"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									></path>
								</svg>
								مغلق (للقراءة فقط)
							</span>
						)}
					</h3>
				</div>
			</div>

			{/* Messages Area */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/30">
				{messages.map((msg) => {
					const isMe = msg.senderId === currentUserId;
					const isAdminMsg =
						msg.message.startsWith("[رسالة إدارية") ||
						msg.message.startsWith("[رسالة النظام");
					const isSenderAdmin = msg.sender.userType === "ADMIN";
					const isSenderTeacher = msg.sender.userType === "TEACHER";
					const isSenderParent = msg.sender.userType === "PARENT";

					let roleIcon = <User className="w-3 h-3" />;
					let roleLabel = "ولي الأمر";

					if (isSenderAdmin) {
						roleIcon = <Shield className="w-3 h-3 text-red-500" />;
						roleLabel = "الإدارة";
					} else if (isSenderTeacher) {
						roleIcon = <GraduationCap className="w-3 h-3 text-emerald-500" />;
						roleLabel = "المعلم";
					}

					return (
						<div
							key={msg.id}
							className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${isAdminMsg ? "items-center" : ""}`}
						>
							{!isAdminMsg && (
								<div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 mx-1">
									{roleIcon}
									<span>
										{msg.sender.name} ({roleLabel})
									</span>
								</div>
							)}
							<div
								className={`max-w-[80%] p-3 rounded-2xl ${
									isAdminMsg
										? "bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-sm w-full text-center flex items-center justify-center gap-2"
										: isMe
											? "bg-blue-600 text-white rounded-tr-none"
											: isSenderAdmin
												? "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-900 dark:text-red-100 rounded-tl-none shadow-sm"
												: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none shadow-sm"
								}`}
							>
								{isAdminMsg && <Info className="w-4 h-4 shrink-0" />}
								<p className="whitespace-pre-wrap">{msg.message}</p>
							</div>
							{!isAdminMsg && (
								<div
									className={`text-[10px] mt-1 text-right ${isMe ? "text-gray-400" : "text-gray-400"}`}
								>
									{new Date(msg.createdAt).toLocaleTimeString("ar-SA", {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>
							)}
						</div>
					);
				})}
				<div ref={bottomRef}></div>
			</div>

			{/* Input Area */}
			{status === "OPEN" && (
				<div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
					<form onSubmit={handleSend} className="flex gap-2">
						{!canSend ? (
							<div className="flex-1 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400 p-3 rounded-xl flex items-center justify-center font-bold text-sm">
								<Info className="w-5 h-5 ml-2" />
								{getTurnMessage()}
							</div>
						) : (
							<>
								<input
									type="text"
									value={msgText}
									onChange={(e) => setMsgText(e.target.value)}
									placeholder="اكتب رسالتك هنا..."
									className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
									disabled={loading}
								/>
								<button
									type="submit"
									disabled={loading || !msgText.trim()}
									className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
								>
									{loading ? "..." : "إرسال"}
								</button>
							</>
						)}
					</form>

					{/* Admin Resolution Controls */}
					{currentUserType === "ADMIN" && (
						<div className="mt-4 space-y-4">
							<div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
								<h4 className="font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-1.5">
									<Shield className="w-4 h-4" />
									التحكم في المحادثة (من يُسمح له بالرد؟)
								</h4>
								<div className="flex flex-wrap gap-2 mt-3">
									<button
										type="button"
										onClick={() => handleTurnChange("BOTH")}
										disabled={loading}
										className={`flex-1 min-w-[120px] py-1.5 rounded-lg text-xs font-bold border transition-all ${allowedTurn === "BOTH" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-700"}`}
									>
										الجميع
									</button>
									<button
										type="button"
										onClick={() => handleTurnChange("PARENT")}
										disabled={loading}
										className={`flex-1 min-w-[120px] py-1.5 rounded-lg text-xs font-bold border transition-all ${allowedTurn === "PARENT" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50 dark:bg-gray-800 dark:border-gray-700"}`}
									>
										انتظار ولي الأمر
									</button>
									<button
										type="button"
										onClick={() => handleTurnChange("TEACHER")}
										disabled={loading}
										className={`flex-1 min-w-[120px] py-1.5 rounded-lg text-xs font-bold border transition-all ${allowedTurn === "TEACHER" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:bg-gray-800 dark:border-gray-700"}`}
									>
										انتظار المعلم
									</button>
									<button
										type="button"
										onClick={() => handleTurnChange("NONE")}
										disabled={loading}
										className={`flex-1 min-w-[120px] py-1.5 rounded-lg text-xs font-bold border transition-all ${allowedTurn === "NONE" ? "bg-red-600 text-white border-red-600" : "bg-white text-red-600 border-red-200 hover:bg-red-50 dark:bg-gray-800 dark:border-gray-700"}`}
									>
										قفل على الجميع
									</button>
								</div>
							</div>

							<div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl">
								<h4 className="font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-1.5">
									<Shield className="w-4 h-4" />
									قرار الإدارة (حسم النزاع نهائياً)
								</h4>
								<input
									type="text"
									value={adminNotes}
									onChange={(e) => setAdminNotes(e.target.value)}
									placeholder="ملاحظات الإدارة (تظهر للطرفين عند الإغلاق)"
									className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm mb-3"
								/>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => handleResolve("RESOLVED_IN_FAVOR_OF_PARENT")}
										disabled={resolving}
										className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition-colors disabled:opacity-50"
									>
										استرداد المبلغ لولي الأمر
									</button>
									<button
										type="button"
										onClick={() =>
											handleResolve("RESOLVED_IN_FAVOR_OF_TEACHER")
										}
										disabled={resolving}
										className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2 rounded-lg transition-colors disabled:opacity-50"
									>
										رفض الاعتراض والدفع للمعلم
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
