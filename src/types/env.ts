export type EbayEnvironment = 'sandbox' | 'production'

export type AppEnvironment = {
  appUrl: string
  ebayEnvironment: EbayEnvironment
}

export function getAppEnvironment(): AppEnvironment {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    ebayEnvironment:
      process.env.EBAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
  }
}
