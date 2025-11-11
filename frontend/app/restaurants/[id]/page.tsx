"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MenuList } from "@/components/menu-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/lib/api"
import { useCart } from "@/contexts/cart"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { formatIDR } from "@/lib/format"
import { MapPin, ShoppingCart } from "lucide-react"
import type { Restaurant, MenuItem } from "@/lib/types"

export default function RestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const restaurantId = params.id as string
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const { items, restaurantId: cartRestaurantId, addItem } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await api.get(`/restaurants/${restaurantId}`)
        const data = response.data?.data
        setRestaurant(data?.restaurant ?? data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal memuat detail restoran",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurant()
  }, [restaurantId, toast])

  const handleAddToCart = (item: MenuItem, quantity: number) => {
    if (cartRestaurantId && cartRestaurantId !== restaurantId) {
      if (confirm("Keranjang Anda dari restoran lain. Hapus keranjang sebelumnya?")) {
        addItem({
          menuId: item._id,
          name: item.name,
          price: item.price,
          quantity,
          restaurantId,
        })
      }
    } else {
      addItem({
        menuId: item._id,
        name: item.name,
        price: item.price,
        quantity,
        restaurantId,
      })
      toast({
        title: "Berhasil",
        description: `${item.name} ditambahkan ke keranjang`,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="h-48 bg-muted rounded-lg animate-pulse mb-8" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 text-center">
          <p className="text-muted-foreground">Restoran tidak ditemukan</p>
        </main>
        <Footer />
      </div>
    )
  }

  const cartCount = items.length

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <p>{restaurant.address}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">Menu</h2>
            <MenuList items={restaurant.menu} onAddToCart={handleAddToCart} restaurantId={restaurantId} />
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Keranjang Anda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Keranjang masih kosong</p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.menuId} className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="font-medium">{item.quantity}x</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex justify-between mb-4 text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-primary">
                          {formatIDR(items.reduce((sum, i) => sum + i.price * i.quantity, 0))}
                        </span>
                      </div>
                      <Button className="w-full" onClick={() => router.push("/checkout")}>
                        Checkout
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
