import { createClient } from "@supabase/supabase-js"

// Supabase istemcisi oluştur (istemci tarafı için)
export const supabase = createClient(process.env.NEXT_PUBLIC_DB_URL!, process.env.NEXT_PUBLIC_DB_ANON_KEY!)

// Servis rolü anahtarı ile istemci (sadece sunucu tarafında kullanılmalı)
export const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_DB_URL!, process.env.DB_SERVICE_KEY!)
