export type MenuItem = {
  _id: string
  name: string
  description?: string
  price: number
  isAvailable: boolean
}

export type Restaurant = {
  _id: string
  name: string
  address?: string
  menu: MenuItem[]
}

export type OrderItemReq = {
  menuId: string
  quantity: number
}

export type Order = {
  _id: string
  userId: string
  restaurantId: string
  restaurantName: string
  items: { menuId: string; quantity: number }[]
  totalPrice: number
  status: "pending" | "paid" | "cancelled" | "completed"
  createdAt: string
  updatedAt: string
}

export type User = {
  _id: string
  name: string
  email: string
  address?: string
}

export type CartItem = {
  menuId: string
  name: string
  price: number
  quantity: number
  restaurantId: string
}
