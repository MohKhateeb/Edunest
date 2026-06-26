import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import ParentLiveRadarClient from "@/components/shared/ParentLiveRadarClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export const dynamic = "force-dynamic";

export default async function ParentLiveRadarPage() {
	const session = await auth();
	await requireAuth([UserType.PARENT]);
	if (!session || session.user.userType !== "PARENT") {
		redirect("/login");
	}

	// Fetch students for this parent
	const students = await prisma.student.findMany({
		where: { parentUserId: session.user.id, isActive: true },
		select: { id: true, name: true, grade: true },
	});

	if (students.length === 0) {
		redirect("/dashboard/profile");
	}

	// Fetch service types for Fazaa (exclude recurring packages)
	const rawServiceTypes = await prisma.serviceType.findMany({
		where: { isActive: true, isRecurring: false },
		select: { id: true, name: true, fazaaPrice: true, fazaaDuration: true },
	});

	const serviceTypes = rawServiceTypes.map((st) => ({
		...st,
		fazaaPrice: st.fazaaPrice ? Number(st.fazaaPrice) : 50,
		fazaaDuration: st.fazaaDuration || 30,
	}));

	const subjects = await prisma.subject.findMany({
		where: { isActive: true },
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});

	return (
		<div className="space-y-6" dir="rtl">
			<ParentLiveRadarClient
				students={students}
				serviceTypes={serviceTypes}
				subjects={subjects}
			/>
		</div>
	);
}
