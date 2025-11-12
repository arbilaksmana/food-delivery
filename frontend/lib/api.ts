import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000",
  withCredentials: false,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  },
)

export default api
