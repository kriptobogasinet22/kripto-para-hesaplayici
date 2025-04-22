"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

type User = {
  id: number
  telegram_id: number
  username: string
  first_name: string
  last_name: string
  created_at: string
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const pageSize = 10

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUsers()
  }, [page])

  const fetchUsers = async () => {
    setLoading(true)

    let query = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (searchTerm) {
      query = query.or(
        `username.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`,
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching users:", error)
    } else {
      setUsers(data as User[])
    }

    setLoading(false)
  }

  const handleSearch = () => {
    setPage(0)
    fetchUsers()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Kullanıcı ara..."
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
                <TableHead>Kullanıcı Adı</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Soyisim</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Kullanıcı bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username ? `@${user.username}` : "-"}</TableCell>
                    <TableCell>{user.first_name || "-"}</TableCell>
                    <TableCell>{user.last_name || "-"}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
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
            <Button onClick={() => setPage(page + 1)} disabled={users.length < pageSize}>
              Sonraki Sayfa
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
