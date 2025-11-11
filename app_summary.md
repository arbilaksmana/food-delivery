# Food Delivery System – Final Team Guide

# (Kelompok 3)

```
Tujuan dokumen : Menjadi single source of truth untuk tim. Berisi arsitektur, ERD, kontrak
API, skema data, alur integrasi, struktur repo, langkah setup, dan checklist per-peran.
Semua contoh sesuai port & scope proyek.
```
## 1) Ringkasan Proyek

```
Arsitektur : API Gateway + 3 microservices (user, restaurant, order) + Frontend React (consumer)
Stack : Node.js, Express, MongoDB, React, axios, JWT, Swagger (swagger-jsdoc, swagger-ui-
express)
Komunikasi : Frontend ➜ Gateway ➜ Services (HTTP). Order-service memanggil user-service &
restaurant-service untuk validasi + kalkulasi harga.
Nilai tambah : JWT di gateway, response format seragam, dokumentasi Swagger gabungan di
gateway.
```
## 2) Arsitektur Sistem

```
[Frontend (React)]
|
v
[API Gateway :3000] -- Auth/JWT, Routing, Rate Limit
/ |
v v v
User Svc Resto Svc Order Svc
:3001 :3002 :
```
**Kontrak port** - Gateway: [http://localhost:3000](http://localhost:3000) - User: [http://localhost:3001](http://localhost:3001) - Restaurant:
[http://localhost:3002](http://localhost:3002) - Order: [http://localhost:](http://localhost:)

**Routing Gateway (contoh)** - /auth/* → user-service - /restaurants/* → restaurant-service - /
orders/* → order-service

## 3) ERD (Mongo-Style)

```
ERD berikut berbasis koleksi MongoDB (referensi via ObjectId). Siap ditempel ke
mermaid.live.
```
```
classDiagram
class User {
```
#### •

#### •

#### •

#### •


```
ObjectId _id
string name
string email
string password
string address
date createdAt
date updatedAt
}
```
```
class Restaurant {
ObjectId _id
string name
string address
MenuItem[] menu
date createdAt
date updatedAt
}
```
```
class MenuItem {
ObjectId _id
string name
string description
number price
boolean isAvailable
}
```
```
class Order {
ObjectId _id
ObjectId userId
ObjectId restaurantId
OrderItem[] items
number totalPrice
string status
date createdAt
date updatedAt
}
```
```
class OrderItem {
ObjectId menuId
number quantity
}
```
```
User "1" <-- "many" Order : userId
Restaurant "1" <-- "many" Order : restaurantId
Restaurant "1" o-- "many" MenuItem : embeds
Order "1" o-- "many" OrderItem : embeds
```
**Index yang disarankan** - User.email → unique index - Order.userId, Order.restaurantId
→ index (untuk filter riwayat) - Restaurant.menu._id → index (mendukung lookup item saat
validasi)


## 4) Sequence Diagram – POST /orders (End-to-End)

```
Alur: FE kirim pesanan ke gateway, gateway verifikasi JWT, order-service validasi user +
restoran/menu, hitung total, simpan order.
```
```
sequenceDiagram
participant FE as Frontend (React)
participant GW as API Gateway (3000)
participant US as user-service (3001)
participant RS as restaurant-service (3002)
participant OS as order-service (3003)
```
```
FE->>GW: POST /orders {userId, restaurantId, items[]} + Bearer JWT
Note over GW: Verifikasi JWT, attach req.user
GW->>OS: POST /orders (forwarded)
```
```
OS->>US: GET /users/:userId (validasi user)
US-->>OS: 200 {user}
```
```
OS->>RS: GET /restaurants/:restaurantId (ambil restoran & menu)
RS-->>OS: 200 {restaurant, menu[]}
```
```
Note over OS: Build map(menu._id), loop items[]; cek tersedia; hitung
totalPrice
OS-->>GW: 201 {status:"success", data:{order}}
GW-->>FE: 201 {status:"success", data:{order}}
```
## 5) Kontrak API (Seragam)

**Format success**

#### {

```
"status": "success",
"data": { /* payload */}
}
```
**Format error**

#### {

```
"status": "error",
"message": "Item menu sedang tidak tersedia"
}
```

### 5.1 user-service (:3001)

**Model** : User { name, email, password, address }

```
POST /register
body: { name, email, password, address }
201 → {status, data:{_id, name, email, address}}
POST /login
body: { email, password }
200 → {status, data:{token}} (JWT)
GET /users/:id
200 → {status, data:{user}}
```
### 5.2 restaurant-service (:3002)

**Model** : Restaurant { name, address, menu:[{_id, name, description, price,
isAvailable}] }

```
GET /restaurants
200 → {status, data:[{...}]}
GET /restaurants/:id
200 → {status, data:{restaurant}} (termasuk menu[])
(Opsional Admin) POST /restaurants, POST /restaurants/:id/menu
```
### 5.3 order-service (:3003)

**Model** : Order { userId, restaurantId, items:[{menuId, quantity}], totalPrice,
status }

```
POST /orders
body: { userId, restaurantId, items:[{menuId, quantity}] }
Alur: validasi user → ambil restoran+menu → hitung totalPrice → simpan
status:'pending'
201 → {status, data:{order}}
GET /orders/user/:userId
200 → {status, data:[{order}...]}
```
### 5.4 API Gateway (:3000)

```
Verifikasi Authorization: Bearer <JWT> pada rute yang butuh autentikasi (order, dsb)
Proxy rute ke service sesuai prefix
Swagger gabungan di /api-docs
```
## 6) Skema Data (Mongoose) – Siap Tempel

```
Sesuaikan path import & koneksi sesuai struktur repo kalian.
```
**User Schema**

#### • • • • • • • • • • • • • • • • • • • • • •


```
constUserSchema =new mongoose.Schema({
name: { type: String, required:true},
email: { type: String, required: true, unique:true, index: true},
password: { type: String, required: true},// bcrypt hash
address: { type: String},
}, { timestamps: true});
```
**Restaurant & MenuItem (embedded)**

```
constMenuItemSchema= new mongoose.Schema({
name: { type: String, required:true},
description: { type: String },
price: { type: Number, required: true, min: 0 },
isAvailable: { type: Boolean, default: true},
}, { _id:true});
```
```
constRestaurantSchema = newmongoose.Schema({
name: { type: String, required:true},
address: { type: String},
menu: { type: [MenuItemSchema],default: [] },
}, { timestamps: true});
```
**Order & OrderItem (embedded)**

```
constOrderItemSchema =new mongoose.Schema({
menuId: { type: mongoose.Schema.Types.ObjectId, required: true},
quantity: { type: Number, required: true, min: 1 }
}, { _id:false});
```
```
constOrderSchema = newmongoose.Schema({
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required:
true, index: true},
restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant',
required: true, index: true},
items: { type: [OrderItemSchema], validate: v => v && v.length > 0 },
totalPrice: { type: Number, required: true, min: 0 },
status: { type: String, enum: ['pending','paid','cancelled','completed'],
default:'pending'}
}, { timestamps: true});
```
## 7) Struktur Repo (Monorepo Contoh)

```
food-delivery/
├─ api-gateway/
```

```
│ ├─ src/
│ │ ├─ index.js (express + proxy + JWT middleware + /api-docs)
│ │ ├─ middleware/auth.js
│ │ └─ swagger.js (gabungkan swagger-jsdoc dari services via remote/JSON)
│ └─ package.json
├─ user-service/
│ ├─ src/
│ │ ├─ models/User.js
│ │ ├─ routes/auth.js (register, login)
│ │ └─ routes/users.js (get by id)
│ └─ package.json
├─ restaurant-service/
│ ├─ src/
│ │ ├─ models/Restaurant.js
│ │ └─ routes/restaurants.js
│ └─ package.json
├─ order-service/
│ ├─ src/
│ │ ├─ models/Order.js
│ │ └─ routes/orders.js (POST /orders, GET /orders/user/:userId)
│ └─ package.json
└─ frontend/
├─ src/
│ ├─ pages/ (Login, Restaurants, RestaurantDetail, Cart/Checkout,
MyOrders)
│ ├─ context/auth.tsx
│ └─ api/client.ts (axios instance → baseURL gateway)
└─ package.json
```
## 8) Environment & Koneksi

**.env contoh** - user-service

#### PORT=

```
MONGO_URI=mongodb://localhost:27017/user_db
JWT_SECRET=supersecret_shared_key
```
- restaurant-service

#### PORT=

```
MONGO_URI=mongodb://localhost:27017/restaurant_db
```
- order-service

#### PORT=

```
MONGO_URI=mongodb://localhost:27017/order_db
```

```
USER_SERVICE_URL=http://localhost:
RESTAURANT_SERVICE_URL=http://localhost:
```
- api-gateway

#### PORT=

```
JWT_SECRET=supersecret_shared_key
USER_SERVICE_TARGET=http://localhost:
RESTAURANT_SERVICE_TARGET=http://localhost:
ORDER_SERVICE_TARGET=http://localhost:
```
```
Catatan : JWT_SECRET di gateway harus sama dengan di user-service untuk verifikasi
token.
```
## 9) Middleware & Keamanan (Gateway)

```
JWT Middleware : baca Authorization: Bearer <token>, verifikasi, attach req.user.
Rate Limiting : batasi request per IP (mis. express-rate-limit).
CORS : izinkan origin frontend.
```
## 10) Dokumentasi Swagger

```
Gunakan swagger-jsdoc di masing-masing service (komentar JSDoc per endpoint)
Gateway menyajikan gabungan di /api-docs (opsi: import file JSON swagger dari tiap service
atau generate satu definisi terpusat)
Sertakan contoh request/response & status code
```
## 11) Langkah Setup & Run (Local)

1) **Install dependencies** per folder api-gateway, user-service, restaurant-service,
order-service, frontend 2) **Jalankan MongoDB** lokal (atau Atlas) 3) **Copy .env contoh** di atas
sesuai tiap service 4) Start berurutan (disarankan): - user-service → restaurant-service → order-service
→ api-gateway → frontend 5) Verifikasi healthcheck: GET /restaurants via gateway, POST /
register, POST /login, POST /orders 6) Buka dokumentasi: [http://localhost:3000/api-](http://localhost:3000/api-)
docs

**Script NPM minimal**

#### {

```
"start": "node src/index.js",
"dev":"nodemon src/index.js"
}
```
#### • • • • • •


## 12) Testing Checklist (Postman / Thunder Client)

```
Auth
✅ Register → login → dapat JWT
Restaurant
✅ List semua restoran → detail restoran (menu[] tampil)
Order
✅ POST /orders dengan items valid → 201 + totalPrice benar
✅ Error saat menu tidak tersedia / menuId tidak ditemukan
✅ GET /orders/user/:userId mengembalikan riwayat
Swagger
✅ /api-docs menampilkan semua endpoint lintas service
```
## 13) Tugas & Deliverables per Peran

**Backend Lead – Rahman (user-service + gateway)** - Register/Login dengan bcrypt - JWT issue & verify
(secret share dgn gateway) - Gateway proxy + middleware JWT + /api-docs gabungan - Deliverables:
source code, env sample, screenshot /api-docs

**Backend – Arbi (restaurant-service)** - Model Restaurant + menu[] embedded - Endpoint list & detail
(opsional CRUD tambah menu) - Deliverables: seed data 3 restoran + 5 menu per restoran, screenshot
get list/detail

**Backend – Elyasa (order-service + integrasi)** - Endpoint POST /orders + kalkulasi totalPrice -
Panggil user-service & restaurant-service via axios - Endpoint GET /orders/user/:userId -
Deliverables: bukti uji 2 skenario (sukses & gagal), screenshot response

**Frontend – Ihsan (React + Docs)** - Halaman: Login/Register, Restaurants, Restaurant Detail, Checkout/
Cart, My Orders - State auth (JWT) + axios instance pointing ke gateway - Integrasi end-to-end -
Deliverables: 3–5 screenshot UI + video pendek flow checkout (opsional)

## 14) Definition of Done (DoD)

```
✅ Semua service berjalan di port standar (3000–3003)
✅ JWT bekerja end-to-end (order butuh token)
✅ Response format seragam (status, data | message)
✅ Swagger tersedia & memuat semua endpoint
✅ ERD & Sequence diagram terlampir
✅ Testing minimal lulus (lihat checklist)
```
## 15) Pengembangan Lanjutan (Opsional)

```
Payment service (dummy) + status paid
Notifikasi (email/webhook) setelah completed
Rate limit & request id logging di gateway
```
#### • • • • • • • • • • • • • • • • • • •


```
Docker Compose untuk orkestrasi lokal
```
## 16) Lampiran – Contoh Swagger JSDoc (Endpoint Login)

#### /**

```
* @swagger
* /login:
* post:
* summary: Login user dan mendapatkan JWT
* tags: [Auth]
* requestBody:
* required: true
* content:
* application/json:
* schema:
* type: object
* required: [email, password]
* properties:
* email: { type: string, example: "user@mail.com" }
* password: { type: string, example: "secret123" }
* responses:
* 200:
* description: Berhasil login
* content:
* application/json:
* schema:
* type: object
* properties:
* status: { type: string, example: "success" }
* data:
* type: object
* properties:
* token: { type: string }
*/
```
**Selesai.** Dokumen ini bisa langsung dibagikan ke tim, dan setiap bagian sudah dipetakan ke peran +
checklist.

#### •


