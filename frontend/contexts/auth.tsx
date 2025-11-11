"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import api from "@/lib/api"
import type { User } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

type AuthContextType = {
  user: User | null
  token: string | null
  loading: boolean
  role?: "user" | "admin" | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, address: string) => Promise<void>
  logout: () => void
  fetchMe: (id: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [role, setRole] = useState<"user" | "admin" | null>(null)
  const [loading, setLoading] = useState(true)
  const loginInFlightRef = useRef(false)
  const { toast } = useToast()

  const fetchMe = async (id: string) => {
    try {
      const response = await api.get(`/users/${id}`)
      setUser(response.data.data.user)
    } catch (error) {
      console.error("Failed to fetch user:", error)
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    if (savedToken) {
      setToken(savedToken)
      // try decode role and userId
      try {
        const payloadBase64 = savedToken.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/")
        if (payloadBase64) {
          const payloadJson =
            typeof window !== "undefined"
              ? atob(payloadBase64)
              : Buffer.from(payloadBase64, "base64").toString("binary")
          const payload = JSON.parse(decodeURIComponent(escape(payloadJson)))
          if (payload?.role) {
            setRole(payload.role)
            localStorage.setItem("role", payload.role)
          }
          // fetch user data if userId available
          if (payload?.id) {
            localStorage.setItem("userId", payload.id)
            fetchMe(payload.id)
          } else {
            const savedUserId = localStorage.getItem("userId")
            if (savedUserId) {
              fetchMe(savedUserId)
            }
          }
        }
      } catch {}
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    if (loginInFlightRef.current) return
    loginInFlightRef.current = true
    try {
      setLoading(true)
      const response = await api.post("/auth/login", { email, password })
      const { token: newToken } = response.data.data
      localStorage.setItem("token", newToken)
      let userId: string | null = null
      try {
        const payloadBase64 = newToken.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/")
        if (payloadBase64) {
          const payloadJson = typeof window !== "undefined" ? atob(payloadBase64) : Buffer.from(payloadBase64, "base64").toString("binary")
          const payload = JSON.parse(decodeURIComponent(escape(payloadJson)))
          if (payload?.id) {
            userId = payload.id
            localStorage.setItem("userId", payload.id)
          }
          if (payload?.role) {
            setRole(payload.role)
            localStorage.setItem("role", payload.role)
          }
        }
      } catch {
        // ignore decode errors
      }
      setToken(newToken)
      // fetch user data after login
      if (userId) {
        await fetchMe(userId)
      }
      toast({
        title: "Berhasil",
        description: "Anda berhasil masuk",
        variant: "default",
      })
    } catch (error: any) {
      const status = error?.response?.status
      const baseMessage = (error as any).response?.data?.message || "Login gagal"
      const message = status === 429 ? "Terlalu banyak percobaan. Coba lagi beberapa saat." : baseMessage
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
      loginInFlightRef.current = false
    }
  }

  const register = async (name: string, email: string, password: string, address: string) => {
    try {
      setLoading(true)
      await api.post("/auth/register", { name, email, password, address })
      toast({
        title: "Berhasil",
        description: "Registrasi berhasil. Silakan login.",
        variant: "default",
      })
    } catch (error) {
      const message = (error as any).response?.data?.message || "Registrasi gagal"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("role")
    setToken(null)
    setRole(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, role, login, register, logout, fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
