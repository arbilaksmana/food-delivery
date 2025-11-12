"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/cart";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import api from "@/lib/api";
import { formatIDR } from "@/lib/format";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { loading: authLoading } = useProtectedRoute();
  const { items, total, restaurantId, clear } = useCart();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const METHOD_MAP: Record<
    string,
    "cod" | "bank_transfer" | "wallet" | "qris"
  > = {
    cash: "cod",
    transfer: "bank_transfer",
    ewallet: "wallet",
  };

  useEffect(() => {
    if (items.length === 0 && !authLoading) {
      router.push("/restaurants");
    }
  }, [items.length, router, authLoading]);

  const handleSubmitOrder = async () => {
    if (!token || !restaurantId || items.length === 0) {
      toast({
        title: "Error",
        description: "Data pesanan tidak lengkap",
        variant: "destructive",
      });
      return;
    }
    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Pilih metode pembayaran",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // 1) create order
      const storedUserId =
        typeof window !== "undefined" ? localStorage.getItem("userId") : null;
      const orderItems = items.map((item) => ({
        menuId: item.menuId,
        quantity: item.quantity,
      }));
      const orderRes = await api.post("/orders", {
        userId: storedUserId || user?._id,
        restaurantId,
        items: orderItems,
        notes,
        paymentMethod: METHOD_MAP[paymentMethod], // simpan juga di order
      });

      const order = orderRes.data?.data?.order;
      const orderId: string = order?._id;
      if (!orderId) throw new Error("Order ID tidak ditemukan");

      const mapMethod = (v: string) =>
        v === "cash"
          ? "cod"
          : v === "transfer"
          ? "bank_transfer"
          : v === "ewallet"
          ? "wallet"
          : "cod";

      // 2) create payment (status: pending)
      await api.post("/payments", {
        orderId: order._id,
        userId: order.userId,
        amount: order.totalPrice,
        method: mapMethod(paymentMethod),
        currency: "IDR",
      });

      toast({
        title: "Berhasil",
        description: "Pesanan & pembayaran dibuat (pending)",
      });
      clear();
      router.push("/orders");
    } catch (e: any) {
      const msg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        "Gagal membuat pesanan";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#fffaf5]">
        <Navbar />
        <main className="flex-1" />
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#fffaf5] to-[#fff0e0] text-[#2b2b2b]">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Back Link */}
        <Link
          href="/restaurants"
          className="flex items-center gap-2 text-[#ff7b29] hover:text-[#e96b15] font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Restoran
        </Link>

        <h1 className="text-4xl font-bold mb-10 text-center text-[#2b2b2b]">
          Checkout Pesanan
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Order Summary & Notes */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border border-[#ffd8b3] shadow-md hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-[#2b2b2b] text-lg font-semibold">
                  Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.menuId}
                    className="flex justify-between pb-4 border-b border-[#ffe5cc] last:border-0"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {formatIDR(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-[#ff7b29]">
                      {formatIDR(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-[#ffd8b3] shadow-md hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-[#2b2b2b] text-lg font-semibold">
                  Catatan (Opsional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Contoh: jangan pakai sambal, saus terpisah, dll."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-32 focus-visible:ring-[#ff7b29]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right: Total Summary */}
          <div>
            <Card className="rounded-2xl border border-[#ffd8b3] shadow-md hover:shadow-lg transition-all bg-white/90 backdrop-blur-sm sticky top-4">
              <CardHeader>
                <CardTitle className="text-[#2b2b2b] text-lg font-semibold">
                  Total Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatIDR(total())}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-sm">
                    <span className="text-gray-500">Ongkos Kirim</span>
                    <span>{formatIDR(0)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#ffe5cc]">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>Total</span>
                    <span className="text-[#ff7b29]">{formatIDR(total())}</span>
                  </div>

                  {/* === Tambahkan bagian ini === */}
                  <div className="pt-4 border-t">
                    <label className="block text-sm font-medium mb-2">
                      Metode Pembayaran
                    </label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="">-- Pilih Metode Pembayaran --</option>
                      <option value="cash">Tunai</option>
                      <option value="transfer">Transfer Bank</option>
                      <option value="ewallet">
                        E-Wallet (GoPay, OVO, DANA)
                      </option>
                    </select>
                  </div>
                  {/* === End === */}

                  <Button
                    className="w-full bg-[#ff7b29] hover:bg-[#e96b15] text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                    onClick={handleSubmitOrder}
                    disabled={submitting || items.length === 0}
                  >
                    {submitting ? "Memproses..." : "Buat Pesanan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
