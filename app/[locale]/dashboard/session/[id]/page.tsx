import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import SessionLobbyClient from "@/components/shared/SessionLobbyClient";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";
import { SessionService } from "@/lib/services/domain/session-service";

export default async function SessionLobbyPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await auth();
	await requireAuth([UserType.ADMIN, UserType.TEACHER, UserType.PARENT]);
	if (!session) redirect("/login");

	const { id: bookingId } = await params;

	const booking = await SessionService.getSessionDetailsData(bookingId);

	if (!booking) {
		console.log(
			`SessionLobbyPage: Booking not found for id ${bookingId}. Redirecting to /dashboard`,
		);
		redirect("/dashboard");
	}

	// Ensure only the parent or the teacher can view this room
	const isParent =
		session.user.userType === "PARENT" &&
		booking.parentUserId === session.user.id;
	const isTeacher =
		session.user.userType === "TEACHER" &&
		booking.teacherService.teacher.userId === session.user.id;

	if (!isParent && !isTeacher) {
		console.log(
			`SessionLobbyPage: Unauthorized access for user ${session.user.id} to booking ${bookingId}. Redirecting to /unauthorized`,
		);
		redirect("/unauthorized");
	}

	return (
		<div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-10" dir="rtl">
			<SessionLobbyClient
				bookingId={booking.id}
				isParent={isParent}
				paymentStatus={booking.paymentStatus}
				meetingUrl={booking.meetingUrl}
				teacherName={booking.teacherService.teacher.user.name || "المعلم"}
				studentName={booking.student.name || "الطالب"}
				subject={booking.teacherService.serviceType.name}
				price={Number(booking.price)}
			/>
		</div>
	);
}
