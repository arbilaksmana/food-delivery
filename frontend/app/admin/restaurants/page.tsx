"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useAdminRoute } from "@/hooks/useAdminRoute"
import api from "@/lib/api"

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

const extractDigits = (input: string) => {
  const digits = input.replace(/\D/g, "")
  return digits ? parseInt(digits, 10) : 0
}

export default function AdminRestaurantsPage() {
  useAdminRoute()
  const { toast } = useToast()
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")

  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("")
  const [menuName, setMenuName] = useState("")
  const [menuPriceValue, setMenuPriceValue] = useState<number>(0)
  const [menuPriceDisplay, setMenuPriceDisplay] = useState<string>("")
  const [menuDescription, setMenuDescription] = useState("")

  const [editingRestaurantId, setEditingRestaurantId] = useState<string>("")
  const [editRestaurantName, setEditRestaurantName] = useState("")
  const [editRestaurantAddress, setEditRestaurantAddress] = useState("")

  const [editingMenu, setEditingMenu] = useState<
    | { restaurantId: string; itemId: string; name: string; price: number; priceInput: string; description: string }
    | null
  >(null)

  const handleMenuPriceInput = (value: string) => {
    const numeric = extractDigits(value)
    setMenuPriceValue(numeric)
    setMenuPriceDisplay(numeric ? formatRupiah(numeric) : "")
  }

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const res = await api.get("/restaurants")
      const data = Array.isArray(res.data?.data) ? res.data.data : []
      setRestaurants(data)
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Gagal memuat restoran", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const handleCreateRestaurant = async () => {
    if (!name.trim()) {
      toast({ title: "Validasi", description: "Nama restoran harus diisi", variant: "destructive" })
      return
    }
    try {
      await api.post("/restaurants", { name, address })
      toast({ title: "Berhasil", description: "Restoran dibuat" })
      setName("")
      setAddress("")
      fetchRestaurants()
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Gagal membuat restoran", variant: "destructive" })
    }
  }

  const handleAddMenu = async () => {
    if (!selectedRestaurant || !menuName.trim() || menuPriceValue <= 0) {
      toast({ title: "Validasi", description: "Pilih restoran dan isi menu & harga", variant: "destructive" })
      return
    }
    try {
      await api.post(`/restaurants/${selectedRestaurant}/menu`, {
        name: menuName,
        price: menuPriceValue,
        description: menuDescription,
        isAvailable: true,
      })
      toast({ title: "Berhasil", description: "Menu ditambahkan" })
      setMenuName("")
      setMenuPriceValue(0)
      setMenuPriceDisplay("")
      setMenuDescription("")
      fetchRestaurants()
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Gagal menambah menu", variant: "destructive" })
    }
  }

  const startEditRestaurant = (r: any) => {
    setEditingRestaurantId(r._id)
    setEditRestaurantName(r.name || "")
    setEditRestaurantAddress(r.address || "")
  }

  const cancelEditRestaurant = () => {
    setEditingRestaurantId("")
    setEditRestaurantName("")
    setEditRestaurantAddress("")
  }

  const handleUpdateRestaurant = async (restaurantId: string) => {
    if (!editRestaurantName.trim()) {
      toast({ title: "Validasi", description: "Nama restoran harus diisi", variant: "destructive" })
      return
    }
    try {
      await api.put(`/restaurants/${restaurantId}`, {
        name: editRestaurantName,
        address: editRestaurantAddress,
      })
      toast({ title: "Berhasil", description: "Restoran diperbarui" })
      cancelEditRestaurant()
      fetchRestaurants()
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Gagal memperbarui restoran", variant: "destructive" })
    }
  }

  const handleDeleteRestaurant = async (restaurantId: string) => {
    try {
      await api.delete(`/restaurants/${restaurantId}`)
      toast({ title: "Berhasil", description: "Restoran dihapus" })
      fetchRestaurants()
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Gagal menghapus restoran", variant: "destructive" })
    }
  }

  const startEditMenu = (restaurantId: string, item: any) => {
    const priceNumber = Number(item.price) || 0
    setEditingMenu({
      restaurantId,
      itemId: item._id,
      name: item.name,
      price: priceNumber,
      priceInput: priceNumber ? formatRupiah(priceNumber) : "",
      description: item.description || "",
    })
  }

  const cancelEditMenu = () => setEditingMenu(null)

  const handleUpdateMenu = async () => {
    if (!editingMenu) return
    if (!editingMenu.name.trim() || editingMenu.price <= 0) {
      toast({ title: "Validasi", description: "Nama dan harga menu wajib diisi", variant: "destructive" })
      return
    }
    try {
      await api.patch(`/restaurants/${editingMenu.restaurantId}/menu`, {
        itemId: editingMenu.itemId,
        name: editingMenu.name,
        price: editingMenu.price,
        description: editingMenu.description,
      })
      toast({ title: "Berhasil", description: "Menu diperbarui" })
      cancelEditMenu()
      fetchRestaurants()
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Gagal memperbarui menu", variant: "destructive" })
    }
  }

  const handleDeleteMenu = async (restaurantId: string, itemId: string) => {
    try {
      await api.delete(`/restaurants/${restaurantId}/menu`, { data: { itemId } })
      toast({ title: "Berhasil", description: "Menu dihapus" })
      if (editingMenu && editingMenu.itemId === itemId) cancelEditMenu()
      fetchRestaurants()
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Gagal menghapus menu", variant: "destructive" })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-primary">Kelola Restoran</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="border-primary/20 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Buat Restoran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nama</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Warung Sederhana" />
              </div>
              <div>
                <Label>Alamat</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Bandung" />
              </div>
              <Button onClick={handleCreateRestaurant} className="w-full bg-primary hover:bg-primary/90">
                Simpan
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-primary/20 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Tambah Menu ke Restoran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pilih Restoran</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                >
                  <option value="">-- Pilih --</option>
                  {restaurants.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nama Menu</Label>
                  <Input value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Nasi Goreng" />
                </div>
                <div>
                  <Label>Harga</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={menuPriceDisplay}
                    onChange={(e) => handleMenuPriceInput(e.target.value)}
                    placeholder="Rp 18.000"
                  />
                </div>
                <div>
                  <Label>Deskripsi (opsional)</Label>
                  <Input value={menuDescription} onChange={(e) => setMenuDescription(e.target.value)} placeholder="Pedas" />
                </div>
              </div>
              <Button onClick={handleAddMenu} className="bg-primary hover:bg-primary/90" disabled={!selectedRestaurant}>
                Tambah Menu
              </Button>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <h2 className="text-xl font-semibold text-primary mb-4">Daftar Restoran</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !restaurants.length ? (
          <p className="text-muted-foreground">Belum ada restoran</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((r) => (
              <Card key={r._id} className="border-primary/20 hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    {editingRestaurantId === r._id ? (
                      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input value={editRestaurantName} onChange={(e) => setEditRestaurantName(e.target.value)} placeholder="Nama restoran" />
                        <Input value={editRestaurantAddress} onChange={(e) => setEditRestaurantAddress(e.target.value)} placeholder="Alamat" />
                      </div>
                    ) : (
                      <CardTitle className="text-lg truncate text-foreground">{r.name}</CardTitle>
                    )}
                    <div className="flex gap-2 shrink-0">
                      {editingRestaurantId === r._id ? (
                        <>
                          <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => handleUpdateRestaurant(r._id)}>Simpan</Button>
                          <Button size="sm" variant="outline" onClick={cancelEditRestaurant}>Batal</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => startEditRestaurant(r)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteRestaurant(r._id)}>Hapus</Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingRestaurantId !== r._id && (
                    <p className="text-sm text-muted-foreground mb-3 truncate">{r.address}</p>
                  )}
                  <p className="text-sm font-medium mb-2">Menu:</p>
                  <ul className="text-sm text-muted-foreground space-y-2 max-h-48 overflow-auto">
                    {(r.menu || []).map((m: any) => (
                      <li key={m._id} className="flex items-center gap-2">
                        {editingMenu && editingMenu.restaurantId === r._id && editingMenu.itemId === m._id ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                            <Input value={editingMenu.name} onChange={(e) => setEditingMenu({ ...editingMenu, name: e.target.value })} placeholder="Nama" />
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={editingMenu.priceInput}
                              onChange={(e) => {
                                if (!editingMenu) return
                                const numeric = extractDigits(e.target.value)
                                setEditingMenu({
                                  ...editingMenu,
                                  price: numeric,
                                  priceInput: numeric ? formatRupiah(numeric) : "",
                                })
                              }}
                              placeholder="Harga"
                            />
                            <Input value={editingMenu.description} onChange={(e) => setEditingMenu({ ...editingMenu, description: e.target.value })} placeholder="Deskripsi" />
                            <div className="flex gap-2 col-span-full">
                              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleUpdateMenu}>Simpan</Button>
                              <Button size="sm" variant="outline" onClick={cancelEditMenu}>Batal</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col gap-1 grow min-w-0">
                              <span className="truncate font-medium">{m.name} · {formatRupiah(Number(m.price) || 0)}</span>
                              {m.description && (
                                <span className="text-xs text-muted-foreground truncate">{m.description}</span>
                              )}
                            </div>
                            <Button size="sm" variant="outline" onClick={() => startEditMenu(r._id, m)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteMenu(r._id, m._id)}>Hapus</Button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
