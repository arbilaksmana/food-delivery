import Link from "next/link"
import { UtensilsCrossed } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-muted bg-card mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 font-medium mb-4">
              <UtensilsCrossed className="w-5 h-5" />
              <span>FoodDelivery</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Layanan pengiriman makanan cepat dan terpercaya di Indonesia.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-sm">Layanan</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/restaurants" className="text-muted-foreground hover:text-foreground transition-colors">
                  Restoran
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pesanan Saya
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-sm">Perusahaan</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Tentang Kami
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-4 text-sm">Kebijakan</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privasi
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Syarat & Ketentuan
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-muted pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} FoodDelivery. Semua hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}
