"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth"
import { Button } from "@/components/ui/button"
import { Clock, Package, UtensilsCrossed, Loader } from "lucide-react"
import { useEffect } from "react"

export default function LandingPage() {
  const { token, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && token) {
      router.push("/restaurants")
    }
  }, [token, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-muted bg-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-medium text-lg">
            <UtensilsCrossed className="w-5 h-5" />
            <span>FoodDelivery</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-sm">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button className="text-sm bg-primary hover:bg-primary/90">Daftar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light leading-tight text-balance">
              Pesan makanan favorit Anda dengan mudah
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ribuan restoran pilihan siap memenuhi selera Anda. Pesan sekarang dan nikmati pengiriman cepat ke pintu
              Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                Mulai Pesan
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-muted hover:bg-muted bg-transparent"
              >
                Saya Sudah Punya Akun
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-light">Kenapa Memilih FoodDelivery?</h2>
            <p className="text-muted-foreground">Layanan terbaik untuk kebutuhan Anda</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: "Pengiriman Cepat",
                description: "Makanan sampai dalam 30 menit atau gratis ongkir",
              },
              {
                icon: Package,
                title: "Pilihan Lengkap",
                description: "Dari restoran lokal hingga internasional dalam satu aplikasi",
              },
              {
                icon: UtensilsCrossed,
                title: "Kualitas Terjamin",
                description: "Hanya restoran terpercaya dan terjamin kualitasnya",
              },
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-card p-8 rounded-lg border border-muted text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="font-medium text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { number: "500+", label: "Restoran Tersedia" },
              { number: "50K+", label: "Pengguna Aktif" },
              { number: "99%", label: "Kepuasan Pelanggan" },
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <p className="text-4xl font-light text-primary">{stat.number}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-card border-t border-muted px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-light">Siap Memesan?</h2>
            <p className="text-muted-foreground">
              Daftar sekarang dan dapatkan penawaran khusus untuk pesanan pertama Anda
            </p>
          </div>
          <Link href="/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Buat Akun Gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-muted bg-card mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FoodDelivery. Semua hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}
