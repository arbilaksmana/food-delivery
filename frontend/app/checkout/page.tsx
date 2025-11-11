"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/contexts/cart"
import { useAuth } from "@/contexts/auth"
import { useToast } from "@/hooks/use-toast"
import { useProtectedRoute } from "@/hooks/useProtectedRoute"
import api from "@/lib/api"
import { formatIDR } from "@/lib/format"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CheckoutPage() {
  const router = useRouter()
  const { loading: authLoading } = useProtectedRoute()
  const { items, total, restaurantId, clear } = useCart()
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (items.length === 0 && !authLoading) {
      router.push("/restaurants")
    }
  }, [items.length, router, authLoading])

  const handleSubmitOrder = async () => {
    if (!token || !restaurantId || items.length === 0) {
      toast({
        title: "Error",
        description: "Data pesanan tidak lengkap",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const orderItems = items.map((item) => ({
        menuId: item.menuId,
        quantity: item.quantity,
      }))

      const storedUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
      const response = await api.post("/orders", {
        userId: storedUserId || user?._id,
        restaurantId,
        items: orderItems,
      })

      toast({
        title: "Berhasil",
        description: "Pesanan berhasil dibuat!",
      })

      clear()
      router.push("/orders")
    } catch (error) {
      const message = (error as any).response?.data?.message || "Gagal membuat pesanan"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1" />
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <Link href="/restaurants" className="flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.menuId} className="flex justify-between pb-4 border-b last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {formatIDR(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatIDR(item.price * item.quantity)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catatan (Opsional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Tambahkan catatan untuk restoran (misal: tidak pakai sambal, dll)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-32"
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Total Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatIDR(total())}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-sm">
                    <span className="text-muted-foreground">Ongkos Kirim</span>
                    <span>{formatIDR(0)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>Total</span>
                    <span className="text-primary">{formatIDR(total())}</span>
                  </div>

                  <Button className="w-full" onClick={handleSubmitOrder} disabled={submitting || items.length === 0}>
                    {submitting ? "Memproses..." : "Buat Pesanan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
