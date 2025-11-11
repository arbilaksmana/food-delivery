"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth"

export function useProtectedRoute() {
  const router = useRouter()
  const { token, loading } = useAuth()

  useEffect(() => {
    if (!loading && !token) {
      router.push("/login")
    }
  }, [token, loading, router])

  return { loading }
}
