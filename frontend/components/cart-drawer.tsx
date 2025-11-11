"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart"
import { formatIDR } from "@/lib/format"
import { ShoppingCart, Trash2 } from "lucide-react"
import Link from "next/link"
import { QuantityStepper } from "./quantity-stepper"

export function CartDrawer() {
  const { items, removeItem, setQuantity, total } = useCart()
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full min-w-[20px] h-5 px-1.5 text-xs font-bold flex items-center justify-center z-10">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Keranjang Anda</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Keranjang masih kosong</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto">
              {items.map((item) => (
                <div key={item.menuId} className="flex items-start justify-between gap-4 p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.name}</h4>
                    <p className="text-sm text-primary font-semibold">{formatIDR(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <QuantityStepper
                      quantity={item.quantity}
                      onQuantityChange={(qty) => setQuantity(item.menuId, qty)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(item.menuId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-4 p-5">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatIDR(total())}</span>
              </div>
              <Button className="w-full " asChild>
                <Link href="/checkout">Lanjut Checkout</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
