import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Yetkisiz Erişim</h1>
        <p className="mb-6">
          Bu sayfaya erişim yetkiniz bulunmamaktadır. Yalnızca admin kullanıcılar bu panele erişebilir.
        </p>
        <Button asChild>
          <Link href="/login">Giriş Sayfasına Dön</Link>
        </Button>
      </div>
    </div>
  )
}
