"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QuantityStepper } from "./quantity-stepper"
import type { MenuItem } from "@/lib/types"
import { formatIDR } from "@/lib/format"
import { Check } from "lucide-react"

type MenuListProps = {
  items: MenuItem[]
  onAddToCart: (item: MenuItem, quantity: number) => void
  restaurantId: string
}

export function MenuList({ items, onAddToCart, restaurantId }: MenuListProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const handleAddToCart = (item: MenuItem) => {
    const quantity = quantities[item._id] || 1
    onAddToCart(item, quantity)
    setQuantities({ ...quantities, [item._id]: 1 })
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Menu belum tersedia</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item._id} className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  {item.isAvailable ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Badge variant="secondary">Tidak Tersedia</Badge>
                  )}
                </div>
                {item.description && <p className="text-sm text-muted-foreground mb-2">{item.description}</p>}
                <p className="font-semibold text-primary">{formatIDR(item.price)}</p>
              </div>
              <div className="flex flex-col gap-3 items-end">
                <QuantityStepper
                  quantity={quantities[item._id] || 1}
                  onQuantityChange={(qty) => setQuantities({ ...quantities, [item._id]: qty })}
                  disabled={!item.isAvailable}
                />
                <Button onClick={() => handleAddToCart(item)} disabled={!item.isAvailable} size="sm">
                  Tambah
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
