import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Dashboard } from "@/components/dashboard"

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Admin kontrolü
  const { data: adminData } = await supabase.from("admins").select("*").eq("user_id", session.user.id).single()

  if (!adminData) {
    redirect("/unauthorized")
  }

  return <Dashboard />
}
