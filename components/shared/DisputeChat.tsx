"use client";

import type { DisputeStatus, DisputeTurn, UserType } from "@prisma/client";
import {
	CheckCircle2,
	GraduationCap,
	Info,
	Loader2,
	Shield,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
	changeDisputeTurn,
	resolveDispute,
	sendDisputeMessage,
} from "@/lib/actions/disputes";
import { DISPUTE_TURN_AR } from "@/lib/translations";

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
	const [pendingTurn, setPendingTurn] = useState<DisputeTurn | null>(null);
	const [resolving, setResolving] = useState(false);
	const [adminNotes, setAdminNotes] = useState("");
	const router = useRouter();
	const bottomRef = useRef<HTMLDivElement>(null);

	// eslint-disable-next-line react-hooks/exhaustive-deps
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
		setPendingTurn(turn);
		const res = await changeDisputeTurn(disputeId, turn);
		if (res.success) {
			router.refresh();
		} else {
			alert(res.error);
		}
		setPendingTurn(null);
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
		<div className="space-y-6">
			{/* Chat Box Container */}
			<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[500px] md:h-[600px]">
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
					</div>
				)}
			</div>

			{/* Admin Resolution Controls Dashboard */}
			{status === "OPEN" && currentUserType === "ADMIN" && (
				<div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
					{/* Turn Controls */}
					<div className="p-5 border border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl shadow-sm flex flex-col justify-between">
						<h4 className="font-bold text-blue-800 dark:text-blue-400 mb-4 flex items-center gap-2">
							<Shield className="w-5 h-5" />
							التحكم في المحادثة (من يُسمح له بالرد؟)
						</h4>
						<div className="grid grid-cols-2 gap-3">
							<button
								type="button"
								onClick={() => handleTurnChange("BOTH")}
								disabled={pendingTurn !== null}
								className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold border transition-all ${allowedTurn === "BOTH" ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-700"}`}
							>
								{pendingTurn === "BOTH" ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									allowedTurn === "BOTH" && (
										<CheckCircle2 className="w-3.5 h-3.5" />
									)
								)}
								الجميع
							</button>
							<button
								type="button"
								onClick={() => handleTurnChange("PARENT")}
								disabled={pendingTurn !== null}
								className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold border transition-all ${allowedTurn === "PARENT" ? "bg-amber-600 text-white border-amber-600 shadow-md" : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50 dark:bg-gray-800 dark:border-gray-700"}`}
							>
								{pendingTurn === "PARENT" ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									allowedTurn === "PARENT" && (
										<CheckCircle2 className="w-3.5 h-3.5" />
									)
								)}
								انتظار {DISPUTE_TURN_AR.PARENT}
							</button>
							<button
								type="button"
								onClick={() => handleTurnChange("TEACHER")}
								disabled={pendingTurn !== null}
								className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold border transition-all ${allowedTurn === "TEACHER" ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:bg-gray-800 dark:border-gray-700"}`}
							>
								{pendingTurn === "TEACHER" ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									allowedTurn === "TEACHER" && (
										<CheckCircle2 className="w-3.5 h-3.5" />
									)
								)}
								انتظار {DISPUTE_TURN_AR.TEACHER}
							</button>
							<button
								type="button"
								onClick={() => handleTurnChange("NONE")}
								disabled={pendingTurn !== null}
								className={`flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold border transition-all ${allowedTurn === "NONE" ? "bg-red-600 text-white border-red-600 shadow-md" : "bg-white text-red-600 border-red-200 hover:bg-red-50 dark:bg-gray-800 dark:border-gray-700"}`}
							>
								{pendingTurn === "NONE" ? (
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
								) : (
									allowedTurn === "NONE" && (
										<CheckCircle2 className="w-3.5 h-3.5" />
									)
								)}
								تحويل لـ {DISPUTE_TURN_AR.NONE}
							</button>
						</div>
					</div>

					{/* Resolve Control */}
					<div className="p-5 border border-red-200 bg-red-50/50 dark:bg-red-900/10 rounded-3xl shadow-sm flex flex-col justify-between">
						<h4 className="font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
							<Shield className="w-5 h-5" />
							قرار الإدارة (حسم النزاع نهائياً)
						</h4>
						<input
							type="text"
							value={adminNotes}
							onChange={(e) => setAdminNotes(e.target.value)}
							placeholder="ملاحظات الإدارة (تظهر للطرفين عند الإغلاق)"
							className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-red-500 transition-all"
						/>
						<div className="flex flex-col sm:flex-row gap-3">
							<button
								type="button"
								onClick={() => handleResolve("RESOLVED_IN_FAVOR_OF_PARENT")}
								disabled={resolving}
								className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-3 rounded-xl font-bold transition-colors shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
							>
								{resolving && <Loader2 className="w-4 h-4 animate-spin" />}
								استرداد لولي الأمر
							</button>
							<button
								type="button"
								onClick={() => handleResolve("RESOLVED_IN_FAVOR_OF_TEACHER")}
								disabled={resolving}
								className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-3 rounded-xl font-bold transition-colors shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
							>
								{resolving && <Loader2 className="w-4 h-4 animate-spin" />}
								دفع للمعلم
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
