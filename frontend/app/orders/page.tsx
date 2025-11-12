"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import type { Order, Restaurant } from "@/lib/types";
import { formatIDR, formatDate } from "@/lib/format";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
  const { loading: authLoading } = useProtectedRoute();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [menuMapByRestaurant, setMenuMapByRestaurant] = useState<
    Record<string, Record<string, string>>
  >({});
  const [paymentMethodByOrder, setPaymentMethodByOrder] = useState<
    Record<string, string>
  >({});

  const labelMethod = (m?: string) => {
    switch (m) {
      case "cod":
      case "cash":
        return "Tunai";
      case "bank_transfer":
      case "transfer":
        return "Transfer Bank";
      case "wallet":
      case "ewallet":
        return "E-Wallet";
      case "qris":
        return "QRIS";
      default:
        return "-";
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      const storedUserId =
        typeof window !== "undefined" ? localStorage.getItem("userId") : null;
      const userId = user?._id || storedUserId;
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // 1) Ambil orders
        const response = await api.get(`/orders/user/${userId}`);
        let fetchedOrders: Order[] = response.data.data;

        // 2) Jika nama restoran tidak tersedia, ambil daftar restoran dan isi dari sana
        const needRestaurantNames = fetchedOrders.some(
          (o) => !o.restaurantName
        );
        if (needRestaurantNames) {
          try {
            const restosRes = await api.get("/restaurants");
            const restaurants: Restaurant[] = restosRes.data.data;
            const restoMap = new Map(restaurants.map((r) => [r._id, r.name]));
            fetchedOrders = fetchedOrders.map((o) => ({
              ...o,
              restaurantName:
                o.restaurantName ||
                (restoMap.get(o.restaurantId) as string) ||
                "Restoran",
            }));
          } catch {
            // abaikan jika gagal; tetap tampilkan tanpa nama
          }
        }

        // 3) Ambil nama menu per restoran untuk menampilkan daftar item
        try {
          const uniqueRestaurantIds = Array.from(
            new Set(fetchedOrders.map((o) => o.restaurantId))
          );
          const details = await Promise.all(
            uniqueRestaurantIds.map(async (rid) => {
              try {
                const res = await api.get(`/restaurants/${rid}`);
                const restoData = res.data?.data?.restaurant ?? res.data?.data;
                const menuArray = Array.isArray(restoData?.menu)
                  ? restoData.menu
                  : [];
                const nameMap: Record<string, string> = {};
                menuArray.forEach((m: { _id: string; name: string }) => {
                  nameMap[m._id] = m.name;
                });
                return [rid, nameMap] as const;
              } catch {
                return [rid, {} as Record<string, string>] as const;
              }
            })
          );
          const mm: Record<string, Record<string, string>> = {};
          details.forEach(([rid, m]) => {
            mm[rid] = m;
          });
          setMenuMapByRestaurant(mm);
        } catch {
          // abaikan jika gagal
        }

        try {
          const entries = await Promise.all(
            fetchedOrders.map(async (o) => {
              try {
                const r = await api.get(`/payments/${o._id}`);
                const method: string | undefined = r.data?.data?.method;
                return [o._id, method] as const;
              } catch {
                return [o._id, undefined] as const;
              }
            })
          );
          const map: Record<string, string> = {};
          entries.forEach(([id, m]) => {
            if (m) map[id] = m;
          });
          setPaymentMethodByOrder(map);
        } catch {
          // ignore
        }

        // Sort by newest first
        fetchedOrders.sort(
          (a: Order, b: Order) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(fetchedOrders);
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal memuat pesanan",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?._id, toast]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pesanan Saya</h1>
          <p className="text-muted-foreground">Riwayat pesanan Anda</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">Belum ada pesanan</p>
              <p className="text-sm text-muted-foreground">
                Pesan makanan favorit Anda sekarang!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Tanggal
                      </p>
                      <p className="font-medium">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Restoran
                      </p>
                      <p className="font-medium">{order.restaurantName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Item</p>
                      <ul className="font-medium space-y-1">
                        {order.items.map((it, idx) => {
                          const names =
                            menuMapByRestaurant[order.restaurantId] || {};
                          const name = names[it.menuId] || "Item";
                          return (
                            <li
                              key={idx}
                              className="flex justify-between gap-3"
                            >
                              <span className="truncate">{name}</span>
                              <span className="font-medium text-foreground">
                                {it.quantity}x
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Total
                      </p>
                      <p className="font-bold text-primary">
                        {formatIDR(order.totalPrice)}
                      </p>
                    </div>
                    {/* payment method */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Metode Pembayaran</p>
                      <p className="font-medium">
                        {labelMethod(paymentMethodByOrder[order._id])}
                      </p>
                    </div>

                    <div>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="flex">
                      {order.status === "pending" && (
                        <Button
                          onClick={async () => {
                            try {
                              await api.patch(`/orders/${order._id}/status`, {
                                status: "paid",
                              });
                              toast({
                                title: "Berhasil",
                                description:
                                  "Status pesanan diubah menjadi Paid.",
                              });
                              // update local state
                              setOrders((prev) =>
                                prev.map((o) =>
                                  o._id === order._id
                                    ? { ...o, status: "paid" }
                                    : o
                                )
                              );
                            } catch (err: any) {
                              toast({
                                title: "Gagal",
                                description:
                                  err.response?.data?.message ||
                                  "Gagal mengubah status.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Saya Sudah Membayar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
