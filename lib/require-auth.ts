import type { UserType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { AuthError } from "@/lib/errors";

import { prisma } from "@/lib/prisma";

type AuthResult = {
	userId: string;
	userType: UserType;
};

/**
 * دالة الحماية المركزية (Defense in Depth) للـ Server Actions والصفحات.
 *
 * المُلخص: هذه الدالة لا تكتفي بالتحقق من وجود الجلسة (Session) في الـ Cookies،
 * بل تقوم بالاتصال بقاعدة البيانات في كل مرة للتحقق من أن المستخدم:
 * 1. لا يزال موجوداً.
 * 2. حسابه لا يزال نشطاً (isActive = true).
 * 3. دوره الحالي في قاعدة البيانات يطابق الأدوار المسموح بها.
 *
 * لماذا؟: لأن الـ JWT Token قد يكون صالحاً لمدة 7 أيام، فإذا تم حظر مستخدم أو تغيير دوره،
 * فإن الـ Middleware وحده قد يتم خداعه (Stale Session Bypass). هذه الدالة تمنع ذلك تماماً.
 *
 * @param allowedTypes - مصفوفة بالأدوار المسموح لها بتنفيذ الإجراء (مثلاً: ADMIN, TEACHER)
 * @returns {Promise<AuthResult>} - معرف المستخدم ودوره الحقيقي من قاعدة البيانات
 * @throws {AuthError} - إذا كان غير مسجل دخول، محظور، أو لا يملك الصلاحية.
 */
export async function requireAuth(
	allowedTypes: UserType[],
): Promise<AuthResult> {
	const session = await auth();
	if (!session?.user?.id || !session.user.userType) {
		throw new AuthError("UNAUTHORIZED", "يجب تسجيل الدخول");
	}

	// Security Check: Verify user still exists and is active (prevents stale session bypass)
	const dbUser = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isActive: true, userType: true },
	});

	if (!dbUser || !dbUser.isActive) {
		throw new AuthError("UNAUTHORIZED", "حسابك معطل أو غير موجود");
	}

	// Security Check: Verify role matches DB (in case admin changed their role while session is active)
	if (!allowedTypes.includes(dbUser.userType)) {
		throw new AuthError("FORBIDDEN", "غير مصرح لك بهذا الإجراء");
	}

	return {
		userId: session.user.id,
		userType: dbUser.userType,
	};
}
