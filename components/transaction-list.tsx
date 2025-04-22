"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

type Transaction = {
  id: number
  user_id: number
  chat_type: string
  from_currency: string
  from_amount: number
  to_currency: string
  to_amount: number
  created_at: string
  users: {
    username: string
    first_name: string
    last_name: string
  }
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const pageSize = 10

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchTransactions()
  }, [page])

  const fetchTransactions = async () => {
    setLoading(true)

    let query = supabase
      .from("transactions")
      .select(`
        *,
        users (
          username,
          first_name,
          last_name
        )
      `)
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (searchTerm) {
      query = query.or(
        `from_currency.ilike.%${searchTerm}%,to_currency.ilike.%${searchTerm}%,users.username.ilike.%${searchTerm}%`,
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching transactions:", error)
    } else {
      setTransactions(data as Transaction[])
    }

    setLoading(false)
  }

  const handleSearch = () => {
    setPage(0)
    fetchTransactions()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Ara: para birimi, kullanıcı adı..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleSearch}>Ara</Button>
      </div>

      {loading ? (
        <div className="text-center py-4">Yükleniyor...</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Sohbet Tipi</TableHead>
                <TableHead>Kaynak</TableHead>
                <TableHead>Hedef</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    İşlem bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>
                      {transaction.users?.username
                        ? `@${transaction.users.username}`
                        : `${transaction.users?.first_name || ""} ${transaction.users?.last_name || ""}`}
                    </TableCell>
                    <TableCell>{transaction.chat_type === "private" ? "Özel" : "Grup"}</TableCell>
                    <TableCell>
                      {transaction.from_amount} {transaction.from_currency}
                    </TableCell>
                    <TableCell>
                      {transaction.to_amount} {transaction.to_currency}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex justify-between">
            <Button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              Önceki Sayfa
            </Button>
            <span>Sayfa {page + 1}</span>
            <Button onClick={() => setPage(page + 1)} disabled={transactions.length < pageSize}>
              Sonraki Sayfa
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
