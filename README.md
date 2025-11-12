# 🍔 Food Delivery Application

Aplikasi food delivery berbasis microservices dengan arsitektur modern menggunakan Node.js, Express, Next.js, dan MongoDB.

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Struktur Project](#-struktur-project)
- [Prerequisites](#-prerequisites)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [API Documentation](#-api-documentation)
- [Fitur Admin](#-fitur-admin)
- [Screenshots](#-screenshots)

## ✨ Fitur

### User Features
- ✅ Registrasi dan Login dengan JWT Authentication
- ✅ Melihat daftar restoran
- ✅ Melihat detail restoran dan menu
- ✅ Menambahkan item ke keranjang
- ✅ Checkout dan membuat pesanan
- ✅ Melihat riwayat pesanan
- ✅ Real-time cart dengan badge counter

### Admin Features
- ✅ Dashboard admin untuk mengelola pesanan
- ✅ Mengelola restoran (CRUD)
- ✅ Mengelola menu restoran (CRUD)
- ✅ Update status pesanan
- ✅ Filter pesanan berdasarkan status
- ✅ Format harga Rupiah otomatis

## 🛠 Teknologi yang Digunakan

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM untuk MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Swagger** - API documentation

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - UI components
- **Axios** - HTTP client
- **React Context** - State management

### Infrastructure
- **API Gateway** - Request routing dan authentication
- **Microservices Architecture** - Service separation

## 🏗 Arsitektur Sistem

```
┌─────────────┐
│   Frontend  │ (Next.js - Port 3000)
│  (Next.js)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │ (Express - Port 3000)
└──────┬──────┘
       │
       ├──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   User   │ │Restaurant│ │  Order   │ │  Admin   │
│ Service  │ │ Service  │ │ Service  │ │ Features │
│ Port 3001│ │Port 3002 │ │Port 3003 │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
       │          │          │
       └──────────┴──────────┘
                  │
                  ▼
            ┌──────────┐
            │ MongoDB  │
            └──────────┘
```

## 📁 Struktur Project

```
food-delivery/
├── api-gateway/          # API Gateway service
│   ├── src/
│   │   ├── index.js      # Main gateway server
│   │   ├── middleware/
│   │   │   └── auth.js   # JWT authentication
│   │   └── swagger.js    # Swagger configuration
│   └── package.json
│
├── user-service/          # User management service
│   ├── src/
│   │   ├── server.js
│   │   ├── controllers/
│   │   │   └── userController.js
│   │   ├── models/
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   └── users.js
│   │   └── db.js
│   ├── seeds/
│   │   └── seed.js
│   └── package.json
│
├── restaurant-service/    # Restaurant management service
│   ├── src/
│   │   ├── server.js
│   │   ├── models/
│   │   │   └── Restaurant.js
│   │   ├── routes/
│   │   │   └── restaurants.js
│   │   └── db.js
│   ├── seeds/
│   │   └── seed.js
│   └── package.json
│
├── order-service/         # Order management service
│   ├── src/
│   │   ├── index.js
│   │   ├── models/
│   │   │   └── Order.js
│   │   ├── routes/
│   │   │   └── orders.js
│   │   └── db.js
│   ├── seeds/
│   │   └── seed.js
│   └── package.json
│
└── frontend/              # Next.js frontend application
    ├── app/               # App router pages
    │   ├── admin/        # Admin pages
    │   ├── checkout/     # Checkout page
    │   ├── orders/       # Order history
    │   ├── restaurants/  # Restaurant pages
    │   └── ...
    ├── components/       # React components
    ├── contexts/         # React contexts (auth, cart)
    ├── lib/              # Utilities
    └── package.json
```

## 📦 Prerequisites

Sebelum memulai, pastikan Anda telah menginstall:

- **Node.js** (v18 atau lebih tinggi)
- **npm** atau **yarn**
- **MongoDB** (local atau MongoDB Atlas)
- **Git**

## 🚀 Instalasi

1. **Clone repository**
```bash
git clone https://github.com/arbilaksmana/food-delivery.git
cd food-delivery
```

2. **Install dependencies untuk semua services**

```bash
# API Gateway
cd api-gateway
npm install
cd ..

# User Service
cd user-service
npm install
cd ..

# Restaurant Service
cd restaurant-service
npm install
cd ..

# Order Service
cd order-service
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

## ⚙️ Konfigurasi

### 1. Environment Variables

Buat file `.env` di setiap service dengan konfigurasi berikut:

#### API Gateway (`api-gateway/.env`)
```env
PORT=3000
JWT_SECRET=supersecret_shared_key
USER_SERVICE_URL=http://localhost:3001
RESTAURANT_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
```

#### User Service (`user-service/.env`)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/food-delivery-users
JWT_SECRET=supersecret_shared_key
```

#### Restaurant Service (`restaurant-service/.env`)
```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/food-delivery-restaurants
```

#### Order Service (`order-service/.env`)
```env
PORT=3003
MONGODB_URI=mongodb://localhost:27017/food-delivery-orders
RESTAURANT_SERVICE_URL=http://localhost:3002
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Database Setup

Pastikan MongoDB berjalan, kemudian jalankan seed untuk setiap service:

```bash
# Seed User Service
cd user-service
npm run seed

# Seed Restaurant Service
cd ../restaurant-service
npm run seed

# Seed Order Service (optional)
cd ../order-service
npm run seed
```

## 🏃 Menjalankan Aplikasi

### Development Mode

Buka terminal terpisah untuk setiap service:

**Terminal 1 - API Gateway**
```bash
cd api-gateway
npm run dev
```

**Terminal 2 - User Service**
```bash
cd user-service
npm run dev
```

**Terminal 3 - Restaurant Service**
```bash
cd restaurant-service
npm run dev
```

**Terminal 4 - Order Service**
```bash
cd order-service
npm run dev
```

**Terminal 5 - Frontend**
```bash
cd frontend
npm run dev
```

### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Start all services
cd ../api-gateway && npm start &
cd ../user-service && npm start &
cd ../restaurant-service && npm start &
cd ../order-service && npm start &
cd ../frontend && npm start &
```

## 📚 API Documentation

Setelah semua service berjalan, dokumentasi API dapat diakses melalui:

- **API Gateway Swagger**: http://localhost:3000/api-docs
- **User Service Swagger**: http://localhost:3001/api-docs
- **Restaurant Service Swagger**: http://localhost:3002/api-docs
- **Order Service Swagger**: http://localhost:3003/api-docs

### Endpoints Utama

#### Authentication
- `POST /auth/register` - Registrasi user baru
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

#### Restaurants
- `GET /restaurants` - Daftar semua restoran
- `GET /restaurants/:id` - Detail restoran
- `GET /restaurants/:id/menu` - Menu restoran
- `POST /restaurants` - Buat restoran (Admin only)
- `PUT /restaurants/:id` - Update restoran (Admin only)
- `DELETE /restaurants/:id` - Hapus restoran (Admin only)

#### Orders
- `POST /orders` - Buat pesanan baru
- `GET /orders` - Daftar pesanan user
- `GET /orders/admin` - Daftar semua pesanan (Admin only)
- `PATCH /orders/admin/:id/status` - Update status pesanan (Admin only)

## 👨‍💼 Fitur Admin

### Role-Based Access Control (RBAC)

Aplikasi mendukung 2 role:
- **user** - Role default untuk customer
- **admin** - Role untuk mengelola sistem

### Cara Membuat Admin User

1. Registrasi user baru melalui `/auth/register`
2. Update role di MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Fitur Admin

- **Kelola Pesanan**: Filter dan update status pesanan
- **Kelola Restoran**: CRUD restoran dan menu
- **Format Harga**: Input harga otomatis terformat Rupiah
- **Real-time Updates**: Perubahan langsung terlihat di UI

## 🎨 Screenshots

### Halaman Utama
- Landing page dengan daftar restoran

### Halaman Restoran
- Detail restoran dengan menu lengkap
- Cart drawer dengan badge counter

### Halaman Admin
- Dashboard untuk mengelola pesanan
- Interface untuk mengelola restoran dan menu

## 🔐 Security Features

- JWT-based authentication
- Password hashing dengan bcryptjs
- Role-based access control (RBAC)
- CORS configuration
- Rate limiting di API Gateway
- Input validation

## 🧪 Testing

Untuk testing, gunakan data seed yang sudah disediakan atau buat user baru melalui registrasi.

## 📝 License

ISC

## 👥 Contributors

- Arbil Aksmana

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📞 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.

---

**Happy Coding! 🚀**

