"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function useAdminRoute(): void {
	const router = useRouter()
	useEffect(() => {
		if (typeof window === "undefined") return
		const token = localStorage.getItem("token")
		const role = localStorage.getItem("role")
		if (!token || role !== "admin") {
			router.push("/login")
		}
	}, [router])
}

export default useAdminRoute

