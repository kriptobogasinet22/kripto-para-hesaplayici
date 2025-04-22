"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionList } from "@/components/transaction-list"
import { RatesList } from "@/components/rates-list"
import { UsersList } from "@/components/users-list"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("transactions")
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kripto Para Hesaplayıcı Admin Paneli</h1>
        <Button variant="outline" onClick={handleSignOut}>
          Çıkış Yap
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">İşlemler</TabsTrigger>
          <TabsTrigger value="rates">Kurlar</TabsTrigger>
          <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>İşlem Geçmişi</CardTitle>
              <CardDescription>Kullanıcıların yaptığı tüm hesaplamalar</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle>Kripto Para Kurları</CardTitle>
              <CardDescription>Güncel kurlar ve son güncelleme zamanları</CardDescription>
            </CardHeader>
            <CardContent>
              <RatesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Kullanıcıları</CardTitle>
              <CardDescription>Botu kullanan Telegram kullanıcıları</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
