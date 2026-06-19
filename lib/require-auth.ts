import { auth } from '@/lib/auth';
import { UserType } from '@prisma/client';
import { AuthError } from '@/lib/errors';

type AuthResult = {
  userId: string;
  userType: UserType;
};

export async function requireAuth(allowedTypes: UserType[]): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id || !session.user.userType) {
    throw new AuthError('UNAUTHORIZED', 'يجب تسجيل الدخول');
  }
  if (!allowedTypes.includes(session.user.userType)) {
    throw new AuthError('FORBIDDEN', 'غير مصرح لك بهذا الإجراء');
  }
  return {
    userId: session.user.id,
    userType: session.user.userType,
  };
}
