import { createClient } from "@supabase/supabase-js"

// Ortam değişkenlerini kontrol et ve varsayılan değerler kullan
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_DB_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_DB_ANON_KEY || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DB_SERVICE_KEY || ""

// Supabase istemcisi oluştur (istemci tarafı için)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Servis rolü anahtarı ile istemci (sadece sunucu tarafında kullanılmalı)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  },
})
