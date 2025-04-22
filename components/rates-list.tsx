"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

type Rate = {
  id: number
  currency: string
  try_rate: number
  last_updated: string
}

export function RatesList() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchRates()
  }, [])

  const fetchRates = async () => {
    setLoading(true)

    let query = supabase.from("rates").select("*").order("currency")

    if (searchTerm) {
      query = query.ilike("currency", `%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching rates:", error)
    } else {
      setRates(data as Rate[])
    }

    setLoading(false)
  }

  const handleSearch = () => {
    fetchRates()
  }

  const handleUpdateRates = async () => {
    try {
      const response = await fetch("/api/update-rates", { method: "POST" })
      if (response.ok) {
        fetchRates()
      } else {
        console.error("Failed to update rates")
      }
    } catch (error) {
      console.error("Error updating rates:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="Para birimi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleSearch}>Ara</Button>
        </div>

        <Button onClick={handleUpdateRates}>Kurları Güncelle</Button>
      </div>

      {loading ? (
        <div className="text-center py-4">Yükleniyor...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Para Birimi</TableHead>
              <TableHead>TL Kuru</TableHead>
              <TableHead>Son Güncelleme</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Kur bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{rate.currency}</TableCell>
                  <TableCell>
                    {rate.try_rate.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </TableCell>
                  <TableCell>{formatDate(rate.last_updated)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
