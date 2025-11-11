"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { RestaurantCard } from "@/components/restaurant-card"
import api from "@/lib/api"
import type { Restaurant } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get("/restaurants")
        setRestaurants(response.data.data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal memuat daftar restoran",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [toast])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Restoran Populer</h1>
          <p className="text-muted-foreground">Pesan makanan favorit Anda sekarang</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Belum ada restoran</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant._id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
