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

export default function LoginPage() {
  const router = useRouter()
  const { login, loading } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      })
      return
    }
    try {
      await login(email, password)
      router.push("/restaurants")
    } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* === BACKGROUND MATCHING LANDING PAGE === */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80"
          alt="Food background"
          className="w-full h-full object-cover absolute inset-0 -z-10"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-black/60" />
      </div>

      {/* === LOGIN CARD === */}
      <Card className="w-full max-w-md relative z-10 shadow-lg border border-[#ffd7b0]/60 bg-white/90 backdrop-blur-md animate-fadeIn">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <UtensilsCrossed className="w-6 h-6 text-[#ff7b29]" />
            <span className="text-xl font-semibold text-[#ff7b29]">FoodDelivery</span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Masuk ke Akun Anda
          </CardTitle>
          <CardDescription className="text-gray-600">
            Selamat datang kembali! Silakan login untuk melanjutkan.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
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
                className="focus:ring-2 focus:ring-[#ff7b29] focus:border-[#ff7b29] transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
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
                className="focus:ring-2 focus:ring-[#ff7b29] focus:border-[#ff7b29] transition-all duration-200"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#ff7b29] hover:bg-[#e96b15] text-white font-semibold rounded-full py-2 transition-all duration-300 shadow-md hover:shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" /> Memproses...
                </div>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Belum punya akun? </span>
            <Link href="/register" className="text-[#ff7b29] hover:underline font-semibold">
              Daftar di sini
            </Link>
          </div>
        </CardContent>

        <div className="h-1 bg-gradient-to-r from-[#ffb37a] via-[#ff7b29] to-[#ffb37a] rounded-b-lg"></div>
      </Card>
    </div>
  )
}
