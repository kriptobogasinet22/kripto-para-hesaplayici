// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.8.3/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const botToken = Deno.env.get("BOT_TOKEN")
if (!botToken) {
  console.error("BOT_TOKEN is not set")
  Deno.exit(1)
}

// Supabase istemcisini oluştur
const supabaseUrl = Deno.env.get("SUPABASE_URL")
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
if (!supabaseUrl || !supabaseKey) {
  console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set")
  Deno.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Bot oluştur
const bot = new Bot(botToken)

// Kullanıcıyı veritabanına kaydet
async function saveUser(user) {
  const { data, error } = await supabase.from("users").upsert(
    {
      telegram_id: user.id,
      username: user.username || null,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
    },
    { onConflict: "telegram_id" },
  )

  if (error) {
    console.error("Error saving user:", error)
  }
  return data
}

// İşlemi veritabanına kaydet
async function saveTransaction(userId, chatType, fromCurrency, fromAmount, toCurrency, toAmount) {
  const { data, error } = await supabase.from("transactions").insert({
    user_id: userId,
    chat_type: chatType,
    from_currency: fromCurrency,
    from_amount: fromAmount,
    to_currency: toCurrency,
    to_amount: toAmount,
  })

  if (error) {
    console.error("Error saving transaction:", error)
  }
  return data
}

// Kur bilgisini al
async function getRate(currency) {
  const { data, error } = await supabase.from("rates").select("try_rate").eq("currency", currency).single()

  if (error) {
    console.error(`Error getting rate for ${currency}:`, error)
    return null
  }
  return data.try_rate
}

// Oransal hesaplama: <Tutar Bilgisi> TRY <Komisyon Bilgisi>
async function calculateProportional(amount, commission) {
  const result = amount * (1 + commission / 100)
  return result.toFixed(2)
}

// Birimsel hesaplama: <Tutar Bilgisi> <Birim Sembolü> to <Dönüştürülecek Birim Sembolü>
async function calculateConversion(amount, fromCurrency, toCurrency) {
  // Kaynak para biriminin TL karşılığını al
  const fromRate = await getRate(fromCurrency)
  if (!fromRate) {
    return { success: false, message: `${fromCurrency} için kur bilgisi bulunamadı.` }
  }

  // Hedef para biriminin TL karşılığını al
  const toRate = await getRate(toCurrency)
  if (!toRate) {
    return { success: false, message: `${toCurrency} için kur bilgisi bulunamadı.` }
  }

  // Dönüşümü hesapla
  const tryAmount = amount * fromRate
  const targetAmount = tryAmount / toRate

  return {
    success: true,
    result: targetAmount.toFixed(6),
    tryAmount: tryAmount.toFixed(2),
  }
}

// Komut işleyicileri
bot.command("start", async (ctx) => {
  await saveUser(ctx.from)

  await ctx.reply(
    "Kripto Para Hesaplayıcı Botuna Hoş Geldiniz!\n\n" +
      "İki tür hesaplama yapabilirsiniz:\n\n" +
      "1. Oransal Hesaplama: <Tutar> TRY %<Komisyon>\n" +
      "   Örnek: 10000 TRY %30\n\n" +
      "2. Birimsel Hesaplama: <Tutar> <Birim> to <Hedef Birim>\n" +
      "   Örnek: 10000 TRY to TRX\n\n" +
      "Desteklenen para birimleri: TRY, BTC, ETH, USDT, BNB, XRP, ADA, SOL, DOGE, TRX, AVAX",
  )
})

bot.command("help", async (ctx) => {
  await ctx.reply(
    "Kripto Para Hesaplayıcı Bot Komutları:\n\n" +
      "/start - Botu başlat\n" +
      "/help - Yardım mesajını göster\n" +
      "/rates - Güncel kurları göster\n\n" +
      "Hesaplama Örnekleri:\n" +
      "10000 TRY %30 - 10000 TL'ye %30 komisyon ekler\n" +
      "10000 TRY to TRX - 10000 TL'nin TRX karşılığını hesaplar\n" +
      "5 BTC to TRY - 5 Bitcoin'in TL karşılığını hesaplar",
  )
})

bot.command("rates", async (ctx) => {
  const { data, error } = await supabase.from("rates").select("*").order("currency")

  if (error || !data) {
    await ctx.reply("Kur bilgileri alınırken bir hata oluştu.")
    return
  }

  let message = "📊 Güncel Kurlar (TL):\n\n"

  for (const rate of data) {
    if (rate.currency !== "TRY") {
      message += `${rate.currency}: ${rate.try_rate.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} TL\n`
    }
  }

  message += `\nSon güncelleme: ${new Date().toLocaleString("tr-TR")}`

  await ctx.reply(message)
})

// Mesaj işleyicisi
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim()
  const user = ctx.from
  const chatType = ctx.chat.type === "private" ? "private" : "group"

  // Kullanıcıyı kaydet
  await saveUser(user)

  // Oransal hesaplama: <Tutar> TRY %<Komisyon>
  const proportionalMatch = text.match(/^(\d+(?:\.\d+)?)\s*TRY\s*%\s*(\d+(?:\.\d+)?)$/i)
  if (proportionalMatch) {
    const amount = Number.parseFloat(proportionalMatch[1])
    const commission = Number.parseFloat(proportionalMatch[2])

    const result = await calculateProportional(amount, commission)

    // İşlemi kaydet
    await saveTransaction(user.id, chatType, "TRY", amount, "TRY", Number.parseFloat(result))

    await ctx.reply(
      `💰 Hesaplama Sonucu:\n\n` +
        `${amount.toLocaleString("tr-TR")} TL + %${commission} = ${Number.parseFloat(result).toLocaleString("tr-TR")} TL`,
    )
    return
  }

  // Birimsel hesaplama: <Tutar> <Birim> to <Hedef Birim>
  const conversionMatch = text.match(/^(\d+(?:\.\d+)?)\s*(\w+)\s*to\s*(\w+)$/i)
  if (conversionMatch) {
    const amount = Number.parseFloat(conversionMatch[1])
    const fromCurrency = conversionMatch[2].toUpperCase()
    const toCurrency = conversionMatch[3].toUpperCase()

    const conversion = await calculateConversion(amount, fromCurrency, toCurrency)

    if (!conversion.success) {
      await ctx.reply(`❌ Hata: ${conversion.message}`)
      return
    }

    // İşlemi kaydet
    await saveTransaction(user.id, chatType, fromCurrency, amount, toCurrency, Number.parseFloat(conversion.result))

    await ctx.reply(
      `💱 Dönüşüm Sonucu:\n\n` +
        `${amount} ${fromCurrency} = ${Number.parseFloat(conversion.result).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${toCurrency}\n` +
        `(${amount} ${fromCurrency} = ${Number.parseFloat(conversion.tryAmount).toLocaleString("tr-TR")} TL)`,
    )
    return
  }
})

// Webhook işleyicisi
serve(webhookCallback(bot, "std/http"))
