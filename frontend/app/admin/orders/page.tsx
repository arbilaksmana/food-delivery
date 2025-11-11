"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAdminRoute } from "@/hooks/useAdminRoute"
import api from "@/lib/api"
import { formatDate, formatIDR } from "@/lib/format"

const STATUS = ["pending", "paid", "cancelled", "completed"] as const

// minimal types for admin orders
type OrderStatus = typeof STATUS[number]
interface OrderItem {
  name?: string
  menuId?: string
  quantity: number
  price?: number
}
interface AdminOrder {
  _id: string
  createdAt: string
  restaurantName?: string
  restaurantId?: string
  items?: OrderItem[]
  totalPrice: number
  status: OrderStatus
}

export default function AdminOrdersPage() {
  useAdminRoute()
  const { toast } = useToast()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [updatingOrderId, setUpdatingOrderId] = useState<string>("")

  // maps for names
  const [restaurantNameMap, setRestaurantNameMap] = useState<Record<string, string>>({})
  const [menuNameMap, setMenuNameMap] = useState<Record<string, string>>({})

  const fetchRestaurantsForMaps = async () => {
    try {
      const res = await api.get("/restaurants")
      const list = Array.isArray(res.data?.data) ? res.data.data : []
      const rMap: Record<string, string> = {}
      const mMap: Record<string, string> = {}
      for (const r of list) {
        if (r?._id && r?.name) rMap[r._id] = r.name
        ;(r?.menu || []).forEach((m: any) => {
          if (m?._id && m?.name) mMap[m._id] = m.name
        })
      }
      setRestaurantNameMap(rMap)
      setMenuNameMap(mMap)
    } catch (e) {
      // ignore silently; UI will fallback to provided names
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await api.get("/orders/admin", {
        params: filterStatus !== "all" ? { status: filterStatus } : undefined,
      })
      setOrders(res.data.data || [])
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Gagal memuat orders", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRestaurantsForMaps()
  }, [])

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus])

  const onChangeStatus = async (orderId: string, status: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId)
      await api.patch(`/orders/admin/${orderId}/status`, { status })
      toast({ title: "Berhasil", description: "Status pesanan diperbarui" })
      await fetchOrders()
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Gagal mengubah status", variant: "destructive" })
    } finally {
      setUpdatingOrderId("")
    }
  }

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      )
    }

    if (!orders.length) {
      return <p className="text-muted-foreground">Belum ada pesanan</p>
    }

    return (
      <div className="space-y-4">
        {orders.map((o) => (
          <Card key={o._id}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tanggal</p>
                  <p className="font-medium">{formatDate(o.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Restoran</p>
                  <p className="font-medium truncate">{o.restaurantName || (o.restaurantId ? restaurantNameMap[o.restaurantId] : undefined) || "Restoran"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Item</p>
                  <ul className="text-sm space-y-1">
                    {o.items?.map((it, idx) => (
                      <li key={idx} className="flex justify-between gap-2">
                        <span className="truncate font-medium">{it.name || (it.menuId ? menuNameMap[it.menuId] : undefined) || "Item"}</span>
                        {typeof it.price === "number" ? (
                          <span className="flex items-center gap-2">
                            <span className="text-muted-foreground">{formatIDR(it.price)} × {it.quantity}</span>
                            <span className="font-medium">{formatIDR((it.price || 0) * it.quantity)}</span>
                          </span>
                        ) : (
                          <span className="font-medium">{it.quantity}x</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="font-bold text-primary">{formatIDR(o.totalPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Select
                    value={o.status}
                    onValueChange={(v) => onChangeStatus(o._id, v as OrderStatus)}
                    disabled={!!updatingOrderId}
                  >
                    <SelectTrigger className="w[160px]" aria-label="Ubah status pesanan">
                      <SelectValue placeholder="Pilih status baru" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }, [loading, orders, updatingOrderId, restaurantNameMap, menuNameMap])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Kelola Pesanan</h1>
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus} disabled={!!updatingOrderId}>
              <SelectTrigger className="w-[160px]" aria-label="Filter status order">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchOrders} disabled={!!updatingOrderId}>
              Refresh
            </Button>
          </div>
        </div>
        {content}
      </main>
      <Footer />
    </div>
  )
}

