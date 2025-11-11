import { formatIDR } from "@/lib/format"

export function PriceTag({ amount }: { amount: number }) {
  return <span className="font-semibold text-primary">{formatIDR(amount)}</span>
}
