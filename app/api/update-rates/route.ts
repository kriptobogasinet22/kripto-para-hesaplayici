import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Popüler kripto para birimleri
const CURRENCIES = ["BTC", "ETH", "USDT", "BNB", "XRP", "ADA", "SOL", "DOGE", "TRX", "AVAX"]

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Yetki kontrolü
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Admin kontrolü
    const { data: adminData } = await supabase.from("admins").select("*").eq("user_id", session.user.id).single()

    if (!adminData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // CoinGecko API'den kurları al
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,ripple,cardano,solana,dogecoin,tron,avalanche-2&vs_currencies=try&include_last_updated_at=true`,
      { headers: { Accept: "application/json" } },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch rates from CoinGecko")
    }

    const data = await response.json()

    // API yanıtını işle ve veritabanını güncelle
    const updates = []

    if (data.bitcoin)
      updates.push({
        currency: "BTC",
        try_rate: data.bitcoin.try,
        last_updated: new Date(data.bitcoin.last_updated_at * 1000).toISOString(),
      })
    if (data.ethereum)
      updates.push({
        currency: "ETH",
        try_rate: data.ethereum.try,
        last_updated: new Date(data.ethereum.last_updated_at * 1000).toISOString(),
      })
    if (data.tether)
      updates.push({
        currency: "USDT",
        try_rate: data.tether.try,
        last_updated: new Date(data.tether.last_updated_at * 1000).toISOString(),
      })
    if (data.binancecoin)
      updates.push({
        currency: "BNB",
        try_rate: data.binancecoin.try,
        last_updated: new Date(data.binancecoin.last_updated_at * 1000).toISOString(),
      })
    if (data.ripple)
      updates.push({
        currency: "XRP",
        try_rate: data.ripple.try,
        last_updated: new Date(data.ripple.last_updated_at * 1000).toISOString(),
      })
    if (data.cardano)
      updates.push({
        currency: "ADA",
        try_rate: data.cardano.try,
        last_updated: new Date(data.cardano.last_updated_at * 1000).toISOString(),
      })
    if (data.solana)
      updates.push({
        currency: "SOL",
        try_rate: data.solana.try,
        last_updated: new Date(data.solana.last_updated_at * 1000).toISOString(),
      })
    if (data.dogecoin)
      updates.push({
        currency: "DOGE",
        try_rate: data.dogecoin.try,
        last_updated: new Date(data.dogecoin.last_updated_at * 1000).toISOString(),
      })
    if (data.tron)
      updates.push({
        currency: "TRX",
        try_rate: data.tron.try,
        last_updated: new Date(data.tron.last_updated_at * 1000).toISOString(),
      })
    if (data["avalanche-2"])
      updates.push({
        currency: "AVAX",
        try_rate: data["avalanche-2"].try,
        last_updated: new Date(data["avalanche-2"].last_updated_at * 1000).toISOString(),
      })

    // TRY'yi de ekle (1 TRY = 1 TRY)
    updates.push({ currency: "TRY", try_rate: 1, last_updated: new Date().toISOString() })

    // Veritabanını güncelle (upsert)
    for (const update of updates) {
      await supabase.from("rates").upsert(
        {
          currency: update.currency,
          try_rate: update.try_rate,
          last_updated: update.last_updated,
        },
        {
          onConflict: "currency",
        },
      )
    }

    return NextResponse.json({ success: true, updated: updates.length })
  } catch (error) {
    console.error("Error updating rates:", error)
    return NextResponse.json({ error: "Failed to update rates" }, { status: 500 })
  }
}
