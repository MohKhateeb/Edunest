import type { UserType } from "@prisma/client";
import { AuthError } from "@/lib/errors";
import { requireAuth } from "@/lib/require-auth";
import type { ActionResponse } from "@/lib/types";

/**
 * A Higher-Order Function (HOF) to wrap Server Actions.
 * It enforces authentication, authorization, and catches errors centrally (DRY).
 *
 * @param allowedTypes The allowed user roles (e.g. [UserType.TEACHER])
 * @param handler The actual business logic of the action
 * @returns A wrapped async function ready to be exported as a Server Action
 */
export function withAuthAction<Args extends unknown[], R = unknown>(
	allowedTypes: UserType[],
	handler: (
		auth: { userId: string; userType: UserType },
		...args: Args
	) => Promise<ActionResponse<R>>,
) {
	return async (...args: Args): Promise<ActionResponse<R>> => {
		try {
			const auth = await requireAuth(allowedTypes);
			return await handler(auth, ...args);
		} catch (err: unknown) {
			console.error(err);

			if (err instanceof AuthError) {
				return { success: false, error: err.message };
			}

			const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
			return { success: false, error: msg };
		}
	};
}
