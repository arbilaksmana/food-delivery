"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader, UtensilsCrossed, MapPin, Star } from "lucide-react"

export default function RestaurantsPage() {
  const { token, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !token) router.push("/login")
  }, [token, loading, router])

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffaf5]">
        <Loader className="w-8 h-8 text-[#ff7b29] animate-spin" />
      </div>
    )

  const restaurants = [
    {
      id: 1,
      name: "Sushi Bento House",
      location: "Jakarta Selatan",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1600891964091-9e5113e3e2c6?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      name: "Warung Nusantara",
      location: "Bandung",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1625944230946-d6b59b67a7f9?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      name: "Italiano Pasta Bar",
      location: "Surabaya",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden text-[#2b2b2b]">
      {/* BACKGROUND — sama dengan login/register */}
      <div className="absolute inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80"
          alt="Food background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#fff0e0]/80 backdrop-blur-sm" />
      </div>

      {/* HEADER */}
      <header className="relative z-10 flex items-center justify-between px-8 py-4 bg-[#fffaf5]/70 backdrop-blur-md border-b border-[#ffd8b3] shadow-sm">
        <div className="flex items-center gap-2 text-[#2b2b2b]">
          <UtensilsCrossed className="w-6 h-6 text-[#ff7b29]" />
          <h1 className="font-semibold text-lg tracking-wide">FoodDelivery</h1>
        </div>
        <Button
          onClick={() => router.push("/")}
          className="bg-[#ff7b29] hover:bg-[#e96b15] text-white font-semibold rounded-full px-6"
        >
          Kembali
        </Button>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex flex-col items-center px-6 py-12">
        <h2 className="text-4xl font-bold mb-2 text-[#2b2b2b]">Restoran Terdekat</h2>
        <p className="text-gray-600 mb-10 text-center max-w-md">
          Temukan berbagai pilihan kuliner terbaik, dengan cita rasa istimewa dan pengantaran cepat.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {restaurants.map((resto) => (
            <Card
              key={resto.id}
              className="bg-white/90 backdrop-blur-md border border-[#ffd8b3]/70 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-3xl overflow-hidden"
            >
              <CardContent className="p-0">
                <img
                  src={resto.image}
                  alt={resto.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1 text-[#2b2b2b]">{resto.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1 text-[#ff7b29]" />
                    {resto.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    {resto.rating} / 5.0
                  </div>

                  <Button className="w-full mt-4 bg-[#ff7b29] hover:bg-[#e96b15] text-white font-semibold rounded-full">
                    Lihat Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 bg-[#fff7f2] text-gray-500 text-center py-8 text-sm border-t border-[#ffd8b3]">
        <p>&copy; {new Date().getFullYear()} FoodDelivery • Semua Hak Dilindungi</p>
      </footer>
    </div>
  )
}
