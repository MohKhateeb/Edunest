export const USER_TYPE = {
  PARENT: 'PARENT',
  TEACHER: 'TEACHER',
  ADMIN: 'ADMIN',
} as const;

export const UserType = USER_TYPE;
export type UserType = (typeof USER_TYPE)[keyof typeof USER_TYPE];

export const VERIFICATION_LEVEL = {
  NONE: 'NONE',
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
} as const;

export type VerificationLevel = (typeof VERIFICATION_LEVEL)[keyof typeof VERIFICATION_LEVEL];
