import { createClient } from '@supabase/supabase-js'

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !publishableKey) {
    throw new Error('Supabase browser credentials are not configured')
  }

  return createClient(supabaseUrl, publishableKey)
}
