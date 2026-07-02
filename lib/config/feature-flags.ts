export type CurrencyCode = 'ILS' | 'USD' | 'EUR' | 'JOD' | 'EGP' | 'SAR' | 'AED' | 'QAR' | 'KWD'

export const FEATURE_FLAGS = {
  I18N_ENABLED: process.env.NEXT_PUBLIC_I18N_ENABLED === 'true',
  DEFAULT_CURRENCY: (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? 'ILS') as CurrencyCode,
} as const
