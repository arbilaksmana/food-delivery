"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth"
import { CartDrawer } from "./cart-drawer"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, UtensilsCrossed, User } from "lucide-react"

export function Navbar() {
  const router = useRouter()
  const { user, token, logout, role } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const isAdmin = role === "admin" || (typeof window !== "undefined" && localStorage.getItem("role") === "admin")

  return (
    <nav className="border-b border-muted bg-card sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/restaurants" className="flex items-center gap-2 font-medium text-lg">
          <UtensilsCrossed className="w-5 h-5" />
          <span>FoodDelivery</span>
        </Link>

        <div className="flex items-center gap-4">
          {token ? (
            <>
              <Link href="/restaurants">
                <Button variant="ghost" className="text-sm">
                  Restoran
                </Button>
              </Link>
              <Link href="/orders">
                <Button variant="ghost" className="text-sm">
                  Pesanan Saya
                </Button>
              </Link>
              {isAdmin && (
                <>
                  <Link href="/admin/orders">
                    <Button variant="ghost" className="text-sm">
                      Kelola Pesanan
                    </Button>
                  </Link>
                  <Link href="/admin/restaurants">
                    <Button variant="ghost" className="text-sm">
                      Kelola Restoran
                    </Button>
                  </Link>
                </>
              )}
              <CartDrawer />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <User className="w-4 h-4 mr-2" />
                    {user?.name || user?.email || "User"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button className="text-sm bg-primary hover:bg-primary/90">Daftar</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
