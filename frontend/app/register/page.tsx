"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth"
import { useToast } from "@/hooks/use-toast"
import { UtensilsCrossed, Loader } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const { register, loading } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [address, setAddress] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !address) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      })
      return
    }
    try {
      await register(name, email, password, address)
      router.push("/login")
    } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* === BACKGROUND === */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80"
          alt="Food background"
          className="w-full h-full object-cover absolute inset-0 -z-10"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-black/60" />
      </div>

      {/* === REGISTER CARD === */}
      <Card className="w-full max-w-sm relative z-10 shadow-lg border border-[#ffd7b0]/60 bg-white/90 backdrop-blur-md animate-fadeIn">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <UtensilsCrossed className="w-5 h-5 text-[#ff7b29]" />
            <span className="text-lg font-semibold text-[#ff7b29]">FoodDelivery</span>
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">Daftar Akun Baru</CardTitle>
          <CardDescription className="text-gray-600 text-sm">
            Bergabung dan nikmati kemudahan pesan makanan.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <Input
                id="name"
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="focus:ring-2 focus:ring-[#ff7b29] focus:border-[#ff7b29] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="focus:ring-2 focus:ring-[#ff7b29] focus:border-[#ff7b29] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="focus:ring-2 focus:ring-[#ff7b29] focus:border-[#ff7b29] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className="text-sm font-medium text-gray-700">
                Alamat
              </label>
              <Input
                id="address"
                placeholder="Jln. Merdeka No. 123"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
                className="focus:ring-2 focus:ring-[#ff7b29] focus:border-[#ff7b29] text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#ff7b29] hover:bg-[#e96b15] text-white font-semibold rounded-full py-2 transition-all duration-300 shadow-md hover:shadow-lg text-sm"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" /> Memproses...
                </div>
              ) : (
                "Daftar"
              )}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm">
            <span className="text-gray-600">Sudah punya akun? </span>
            <Link href="/login" className="text-[#ff7b29] hover:underline font-semibold">
              Masuk di sini
            </Link>
          </div>
        </CardContent>

        <div className="h-1 bg-gradient-to-r from-[#ffb37a] via-[#ff7b29] to-[#ffb37a] rounded-b-lg"></div>
      </Card>
    </div>
  )
}
