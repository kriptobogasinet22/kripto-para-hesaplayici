import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Supabase istemcisini oluştur
  const supabase = createMiddlewareClient({ req, res })

  // Oturumu kontrol et
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Eğer oturum yoksa ve korunan bir sayfaya erişmeye çalışıyorsa
  if (!session && req.nextUrl.pathname !== "/login" && !req.nextUrl.pathname.startsWith("/api/")) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
