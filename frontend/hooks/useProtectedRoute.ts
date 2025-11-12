"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth";

export function useProtectedRoute() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (pathname === "/login") return; // jangan proteksi halaman login
    if (!token) router.replace("/login");
  }, [token, loading, router, pathname]);

  return { loading };
}
