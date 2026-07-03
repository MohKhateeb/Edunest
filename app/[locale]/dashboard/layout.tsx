import { UserType } from "@prisma/client";
import { redirect } from "next/navigation";
import Header from "@/components/shared/Header";
import Sidebar from "@/components/shared/Sidebar";
import { auth } from "@/lib/auth";
import { requireAuth } from "@/lib/require-auth";

	import { AuthError } from "@/lib/errors";

	export default async function DashboardLayout({
		children,
	}: {
		children: React.ReactNode;
	}) {
		try {
			await requireAuth([UserType.ADMIN, UserType.TEACHER, UserType.PARENT]);
		} catch (error) {
			if (error instanceof AuthError) {
				if (error.code === "UNAUTHORIZED") {
					redirect("/login");
				}
				if (error.code === "FORBIDDEN") {
					redirect("/unauthorized");
				}
			}
			throw error;
		}

	return (
		<div className="min-h-screen flex flex-col bg-background">
			<Header />
			<div className="flex flex-1">
				<Sidebar />
				<main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
					{children}
				</main>
			</div>
		</div>
	);
}
