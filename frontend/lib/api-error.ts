export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any,
  ) {
    super(message)
    this.name = "APIError"
  }
}

export const handleAPIError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.response?.status === 401) {
    return "Session Anda telah berakhir. Silakan login kembali."
  }
  if (error.response?.status === 404) {
    return "Data tidak ditemukan."
  }
  if (error.response?.status >= 500) {
    return "Terjadi kesalahan pada server. Silakan coba lagi nanti."
  }
  return error.message || "Terjadi kesalahan. Silakan coba lagi."
}
