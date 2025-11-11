import type { Order } from "@/lib/types"

type StatusVariant = "pending" | "paid" | "cancelled" | "completed" | "default"

export function StatusBadge({ status }: { status: Order["status"] }) {
  const variantMap: Record<Order["status"], StatusVariant> = {
    pending: "pending",
    paid: "default",
    cancelled: "destructive",
    completed: "default",
  }

  const labelMap: Record<Order["status"], string> = {
    pending: "Menunggu",
    paid: "Dibayar",
    cancelled: "Dibatalkan",
    completed: "Selesai",
  }

  const colorMap: Record<Order["status"], string> = {
    pending: "bg-amber-100 text-amber-800",
    paid: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[status]}`}>
      {labelMap[status]}
    </span>
  )
}
