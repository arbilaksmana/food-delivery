import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import type { Restaurant } from "@/lib/types"

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link href={`/restaurants/${restaurant._id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{restaurant.name}</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{restaurant.address || "Alamat tidak tersedia"}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <div>Lihat Menu</div>
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}
