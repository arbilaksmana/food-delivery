"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import type { CartItem } from "@/lib/types"

type CartContextType = {
  items: CartItem[]
  restaurantId: string | null
  addItem: (item: CartItem) => void
  removeItem: (menuId: string) => void
  setQuantity: (menuId: string, quantity: number) => void
  clear: () => void
  total: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuId === item.menuId)
      if (existing) {
        return prev.map((i) => (i.menuId === item.menuId ? { ...i, quantity: i.quantity + item.quantity } : i))
      }
      return [...prev, item]
    })
    setRestaurantId(item.restaurantId)
  }, [])

  const removeItem = useCallback((menuId: string) => {
    setItems((prev) => prev.filter((i) => i.menuId !== menuId))
  }, [])

  const setQuantity = useCallback(
    (menuId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(menuId)
        return
      }
      setItems((prev) => prev.map((i) => (i.menuId === menuId ? { ...i, quantity } : i)))
    },
    [removeItem],
  )

  const clear = useCallback(() => {
    setItems([])
    setRestaurantId(null)
  }, [])

  const total = useCallback(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])

  return (
    <CartContext.Provider value={{ items, restaurantId, addItem, removeItem, setQuantity, clear, total }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}
