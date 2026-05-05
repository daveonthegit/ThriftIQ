import { z } from 'zod'

const ebayEnvironmentSchema = z
  .enum(['sandbox', 'production'])
  .default('sandbox')

const appEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  EBAY_ENVIRONMENT: ebayEnvironmentSchema,
})

const productionEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  EBAY_CLIENT_ID: z.string().min(1),
  EBAY_CLIENT_SECRET: z.string().min(1),
  EBAY_ENVIRONMENT: ebayEnvironmentSchema,
})

export type EbayEnvironment = z.infer<typeof ebayEnvironmentSchema>

export type AppEnvironment = {
  appUrl: string
  ebayEnvironment: EbayEnvironment
}

export type EnvironmentReadiness = {
  ready: boolean
  missing: string[]
}

export function getAppEnvironment(): AppEnvironment {
  const parsed = appEnvironmentSchema.parse(process.env)

  return {
    appUrl: parsed.NEXT_PUBLIC_APP_URL,
    ebayEnvironment: parsed.EBAY_ENVIRONMENT,
  }
}

export function getProductionEnvironmentReadiness(): EnvironmentReadiness {
  const parsed = productionEnvironmentSchema.safeParse(process.env)

  if (parsed.success) {
    return { ready: true, missing: [] }
  }

  const missing = parsed.error.issues
    .map(issue => issue.path.join('.'))
    .filter(Boolean)
    .sort()

  return {
    ready: false,
    missing: [...new Set(missing)],
  }
}
