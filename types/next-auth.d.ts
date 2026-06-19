import { UserType } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    userType: UserType;
  }
  interface Session {
    user: {
      id: string;
      userType: UserType;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userType: UserType;
  }
}
