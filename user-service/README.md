# Restaurant Service

Backend service untuk **Food Delivery System** yang menyediakan data restoran dan menu makanan. Service ini digunakan oleh **order-service** dan frontend melalui **API Gateway**.

## 📋 Informasi Service

- **Base URL**: `http://localhost:3002`
- **Port**: `3002`
- **Database**: MongoDB (`restaurant_db`)
- **Tech Stack**: Node.js + Express + MongoDB + Mongoose

## 🚀 Quick Start

### Prasyarat

1. **Node.js LTS** terpasang (`node -v`, `npm -v`)
2. **MongoDB** berjalan di `localhost:27017`
   - Windows: Pastikan MongoDB Service running
   - Atau gunakan MongoDB Compass untuk verifikasi

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
# Copy .env.example to .env dan sesuaikan jika perlu
# Default sudah sesuai untuk development lokal

# 3. Seed database dengan sample data
npm run seed

# 4. Start service
npm run dev
```

Service akan berjalan di `http://localhost:3002`

## 📝 Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Jalankan service dengan nodemon (hot reload) |
| `npm start` | Jalankan service production mode |
| `npm run seed` | Seed database dengan sample data (3 restoran, 5 menu per restoran) |

## 🔌 API Endpoints

### Base URL
```
http://localhost:3002
```

### Response Format

Semua response mengikuti format seragam:

**Success:**
```json
{
  "status": "success",
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Error message"
}
```

---

### 1. Health Check

**GET** `/health`

Cek status service.

**Response:**
```json
{
  "status": "ok"
}
```

---

### 2. List Restaurants

**GET** `/restaurants`

Mendapatkan daftar semua restoran.

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Warung Sederhana",
      "address": "Bandung",
      "menu": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Nasi Goreng",
          "description": "Pedas",
          "price": 18000,
          "isAvailable": true,
          "createdAt": "2025-02-11T...",
          "updatedAt": "2025-02-11T..."
        }
        // ... more menu items
      ],
      "createdAt": "2025-02-11T...",
      "updatedAt": "2025-02-11T..."
    }
    // ... more restaurants
  ]
}
```

---

### 3. Get Restaurant by ID

**GET** `/restaurants/:id`

Mendapatkan detail restoran beserta menu.

**Path Parameters:**
- `id` (string, required) - Restaurant ID (MongoDB ObjectId)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Warung Sederhana",
    "address": "Bandung",
    "menu": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Nasi Goreng",
        "description": "Pedas",
        "price": 18000,
        "isAvailable": true,
        "createdAt": "2025-02-11T...",
        "updatedAt": "2025-02-11T..."
      }
      // ... more menu items
    ],
    "createdAt": "2025-02-11T...",
    "updatedAt": "2025-02-11T..."
  }
}
```

**Response (404):**
```json
{
  "status": "error",
  "message": "Restaurant not found"
}
```

---

### 4. Create Restaurant

**POST** `/restaurants`

Membuat restoran baru (untuk admin/seed).

**Request Body:**
```json
{
  "name": "Restaurant Name",
  "address": "Address",
  "menu": [
    {
      "name": "Menu Item",
      "description": "Description",
      "price": 20000,
      "isAvailable": true
    }
  ]
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Restaurant Name",
    "address": "Address",
    "menu": [...],
    "createdAt": "2025-02-11T...",
    "updatedAt": "2025-02-11T..."
  }
}
```

---

### 5. Add Menu Item

**POST** `/restaurants/:id/menu`

Menambahkan menu item ke restoran.

**Path Parameters:**
- `id` (string, required) - Restaurant ID

**Request Body:**
```json
{
  "name": "Menu Item Name",
  "description": "Description (optional)",
  "price": 20000,
  "isAvailable": true
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Restaurant Name",
    "menu": [
      // ... existing menu items
      {
        "_id": "507f1f77bcf86cd799439015",
        "name": "Menu Item Name",
        "description": "Description",
        "price": 20000,
        "isAvailable": true,
        "createdAt": "2025-02-11T...",
        "updatedAt": "2025-02-11T..."
      }
    ]
  }
}
```

---

## 🔗 Integrasi dengan Service Lain

### Untuk Order Service

Order service dapat memanggil endpoint ini untuk mendapatkan data restoran dan menu:

```javascript
// Contoh di order-service
const restaurantId = "507f1f77bcf86cd799439011";
const response = await fetch(`http://localhost:3002/restaurants/${restaurantId}`);
const result = await response.json();

if (result.status === "success") {
  const restaurant = result.data;
  // Gunakan restaurant.menu untuk validasi dan hitung totalPrice
  const menuItem = restaurant.menu.find(item => 
    item._id.toString() === menuItemId && item.isAvailable
  );
}
```

**Penting:**
- Validasi `isAvailable` sebelum memproses order
- Gunakan `menu._id` untuk referensi item menu
- Gunakan `price` untuk menghitung `totalPrice`

### Untuk API Gateway

API Gateway dapat mem-proxy request:

```
GET /restaurants/* → http://localhost:3002/restaurants/*
```

Pastikan gateway mengarahkan request dengan prefix `/restaurants` ke service ini.

---

## 📚 Swagger Documentation

Swagger UI tersedia di:
```
http://localhost:3002/api-docs
```

Dokumentasi interaktif untuk semua endpoint dengan kemampuan test langsung.

---

## 🗄️ Database Schema

### Restaurant

```javascript
{
  name: String (required),
  address: String,
  menu: [MenuItem],
  createdAt: Date,
  updatedAt: Date
}
```

### MenuItem (Embedded)

```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String,
  price: Number (required, min: 0),
  isAvailable: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Index:**
- `menu._id` - Untuk optimasi lookup menu item oleh order-service

---

## 🧪 Testing

### Manual Testing dengan cURL

```bash
# Health check
curl http://localhost:3002/health

# List restaurants
curl http://localhost:3002/restaurants

# Get restaurant by ID (ganti <id> dengan ID dari hasil list)
curl http://localhost:3002/restaurants/<id>

# Create restaurant
curl -X POST http://localhost:3002/restaurants \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Restaurant","address":"Test Address","menu":[]}'
```

### Testing dengan Postman

Import collection atau gunakan Swagger UI di `http://localhost:3002/api-docs` untuk testing interaktif.

---

## ⚙️ Environment Variables

File `.env`:

```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/restaurant_db
```

Untuk production, sesuaikan `MONGODB_URI` dengan connection string MongoDB Atlas atau server MongoDB lainnya.

---

## 📁 Project Structure

```
restaurant-service/
├── src/
│   ├── server.js          # Main server file
│   ├── db.js              # MongoDB connection
│   ├── models/
│   │   └── Restaurant.js  # Restaurant & MenuItem schema
│   └── routes/
│       └── restaurants.js # API routes
├── seeds/
│   └── seed.js            # Seed data script
├── .env                   # Environment variables
├── package.json
└── README.md
```

---

## ❗ Troubleshooting

### MongoDB Connection Error

**Error:** `MongoDB connection error: connect ECONNREFUSED`

**Solution:**
- Pastikan MongoDB service running (Windows: Services → MongoDB)
- Atau jalankan `mongod` secara manual
- Cek `MONGODB_URI` di `.env`

### Port Already in Use

**Error:** `Port 3002 already in use`

**Solution:**
- Ubah `PORT` di `.env` ke port lain
- Atau stop service lain yang menggunakan port 3002

### CastError: Invalid ObjectId

**Error:** Ketika mengakses `/restaurants/:id` dengan ID yang tidak valid

**Solution:**
- Pastikan ID yang digunakan adalah MongoDB ObjectId valid
- Dapatkan ID dari hasil `GET /restaurants`

### Menu Empty

**Solution:**
- Jalankan `npm run seed` untuk populate database
- Pastikan database name di `.env` sesuai

---

## 🤝 Untuk Tim Development

### Checklist Integrasi

- [x] Service berjalan di port 3002
- [x] Response format seragam (`{status, data}` atau `{status, message}`)
- [x] Swagger documentation tersedia
- [x] Sample data sudah di-seed (3 restoran, 5 menu per restoran)
- [x] Health check endpoint tersedia
- [x] CORS enabled untuk development

### Catatan untuk Order Service

- Gunakan `GET /restaurants/:id` untuk mendapatkan menu
- Validasi `isAvailable: true` sebelum proses order
- Gunakan `menu._id` sebagai referensi (bukan array index)
- Gunakan `menu.price` untuk hitung totalPrice

### Catatan untuk API Gateway

- Proxy semua request `/restaurants/*` ke `http://localhost:3002`
- Pastikan response format tetap konsisten
- Swagger dapat di-merge ke dokumentasi gateway terpusat

---

## 📞 Contact & Support

Jika ada pertanyaan tentang integrasi atau masalah teknis, hubungi tim restaurant-service.

---

## 📄 License

ISC

