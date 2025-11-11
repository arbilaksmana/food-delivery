# Restaurant Service — Cursor Task (NO DOCKER)

Backend untuk **Food Delivery System**. Service ini menyediakan data restoran & menu untuk dipakai **order-service** dan frontend via **API Gateway**.

* Service URL: `http://localhost:3002`
* Bahasa/Stack: Node.js (Runtime) + Express (Web) + MongoDB (Database) + Mongoose (ODM)
* Format respons **seragam**:

  ```json
  // success
  { "status": "success", "data": { /* ... */ } }
  // error
  { "status": "error", "message": "..." }
  ```

> Catatan: README ini **tanpa Docker**. Jalankan MongoDB lokal (Windows) atau MongoDB Atlas.

---

## 0) Prasyarat Lokal (Windows)

1. **Node.js LTS** terpasang (cek: `node -v`, `npm -v`).
2. **MongoDB Community Server** terpasang & jalan sebagai service (`mongod`).

   * Opsi GUI: **MongoDB Compass** (opsional).
3. Pastikan port default **27017** tidak bentrok.

---

## 1) Buat Proyek & Install Dependensi

> Jalankan perintah ini di terminal **Cursor**.

```bash
mkdir restaurant-service && cd restaurant-service
npm init -y
npm i express mongoose dotenv cors morgan
npm i -D nodemon
mkdir -p src/models src/routes src/utils seeds
```

Buat file kosong:

```
src/server.js
src/db.js
src/models/Restaurant.js
src/routes/restaurants.js
seeds/seed.js
.env
```

### package.json (scripts)

```json
{
  "name": "restaurant-service",
  "version": "1.0.0",
  "main": "src/server.js",
  "type": "commonjs",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node seeds/seed.js"
  }
}
```

### .env (contoh)

```
PORT=3002
MONGODB_URI=mongodb://localhost:27017/restaurant_db
```

---

## 2) Koneksi Database (Mongoose)

**`src/db.js`**

```js
const mongoose = require('mongoose');

async function connectDB(uri) {
  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
```

---

## 3) Schema & Model (Restaurant + MenuItem embedded)

**`src/models/Restaurant.js`**

```js
const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true }
  },
  { _id: true, timestamps: true }
);

const RestaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    menu: { type: [MenuItemSchema], default: [] }
  },
  { timestamps: true }
);

// index bantu lookup menu._id (order-service hitung totalPrice)
RestaurantSchema.index({ 'menu._id': 1 });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
```

---

## 4) Router (Endpoint Utama)

**`src/routes/restaurants.js`**

```js
const express = require('express');
const Restaurant = require('../models/Restaurant');
const router = express.Router();

const ok = (data) => ({ status: 'success', data });
const fail = (message) => ({ status: 'error', message });

/**
 * GET /restaurants
 * List semua restoran
 */
router.get('/', async (_req, res) => {
  try {
    const data = await Restaurant.find().lean();
    res.json(ok(data));
  } catch (e) {
    res.status(500).json(fail(e.message));
  }
});

/**
 * GET /restaurants/:id
 * Detail restoran (termasuk menu[])
 */
router.get('/:id', async (req, res) => {
  try {
    const data = await Restaurant.findById(req.params.id).lean();
    if (!data) return res.status(404).json(fail('Restaurant not found'));
    res.json(ok(data));
  } catch (e) {
    res.status(500).json(fail(e.message));
  }
});

/**
 * POST /restaurants
 * Tambah restoran (opsional: admin/seed)
 */
router.post('/', async (req, res) => {
  try {
    const doc = await Restaurant.create(req.body);
    res.status(201).json(ok(doc));
  } catch (e) {
    res.status(400).json(fail(e.message));
  }
});

/**
 * POST /restaurants/:id/menu
 * Tambah item menu (opsional: admin/seed)
 */
router.post('/:id/menu', async (req, res) => {
  try {
    const { name, description, price, isAvailable } = req.body;
    const r = await Restaurant.findById(req.params.id);
    if (!r) return res.status(404).json(fail('Restaurant not found'));

    r.menu.push({ name, description, price, isAvailable });
    await r.save();

    res.status(201).json(ok(r));
  } catch (e) {
    res.status(400).json(fail(e.message));
  }
});

module.exports = router;
```

---

## 5) Bootstrap Server

**`src/server.js`**

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./db');
const restaurantsRouter = require('./routes/restaurants');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// healthcheck
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// routes
app.use('/restaurants', restaurantsRouter);

const { PORT = 3002, MONGODB_URI } = process.env;

(async () => {
  await connectDB(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`🚀 restaurant-service running at http://localhost:${PORT}`);
  });
})();
```

---

## 6) Seed Data (≥3 restoran, ≥5 menu per restoran)

**`seeds/seed.js`**

```js
require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../src/models/Restaurant');

const { MONGODB_URI = 'mongodb://localhost:27017/restaurant_db' } = process.env;

const data = [
  {
    name: 'Warung Sederhana',
    address: 'Bandung',
    menu: [
      { name: 'Nasi Goreng', description: 'Pedas', price: 18000, isAvailable: true },
      { name: 'Mie Goreng', description: 'Jawa', price: 17000, isAvailable: true },
      { name: 'Ayam Bakar', description: 'Manis', price: 25000, isAvailable: true },
      { name: 'Soto Ayam', description: '', price: 16000, isAvailable: true },
      { name: 'Es Teh', description: '', price: 6000, isAvailable: true }
    ]
  },
  {
    name: 'Bakso Mantul',
    address: 'Cimahi',
    menu: [
      { name: 'Bakso Urat', description: '', price: 20000, isAvailable: true },
      { name: 'Bakso Halus', description: '', price: 18000, isAvailable: true },
      { name: 'Mie Bakso', description: '', price: 22000, isAvailable: true },
      { name: 'Cuanki', description: '', price: 15000, isAvailable: false },
      { name: 'Es Jeruk', description: '', price: 7000, isAvailable: true }
    ]
  },
  {
    name: 'Sushi Hemat',
    address: 'Jakarta',
    menu: [
      { name: 'Salmon Roll', description: '', price: 32000, isAvailable: true },
      { name: 'Tuna Roll', description: '', price: 29000, isAvailable: true },
      { name: 'Kani Roll', description: '', price: 26000, isAvailable: true },
      { name: 'Tamago', description: '', price: 12000, isAvailable: true },
      { name: 'Ocha', description: '', price: 5000, isAvailable: true }
    ]
  }
];

(async () => {
  try {
    await mongoose.connect(MONGODB_URI, { autoIndex: true });
    console.log('✅ MongoDB connected');

    await Restaurant.deleteMany({});
    await Restaurant.insertMany(data);

    console.log('✅ Seeded sample restaurants & menus');
  } catch (e) {
    console.error('❌ Seed error:', e.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
```

Jalankan:

```bash
npm run seed
```

---

## 7) Swagger Lokal (opsional, biar siap digabung ke Gateway)

> Di UTS, dokumentasi Swagger boleh disajikan terpusat di **API Gateway**. Tambahan berikut hanya untuk pratinjau lokal.

```bash
npm i swagger-jsdoc swagger-ui-express
```

Tambahkan di `src/server.js` (import):

```js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
```

Lalu sebelum `app.listen(...)`:

```js
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Restaurant Service API', version: '1.0.0' }
  },
  apis: ['./src/routes/*.js']
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

Contoh anotasi di `src/routes/restaurants.js` (tepat di atas handler):

```js
/**
 * @openapi
 * /restaurants:
 *   get:
 *     summary: List restaurants
 *     responses:
 *       200:
 *         description: Success
 */
```

Buka: `http://localhost:3002/api-docs`

---

## 8) Cara Menjalankan

```bash
# 1) install dep
npm i

# 2) pastikan MongoDB lokal jalan (Windows Services / MongoDB Compass)

# 3) seed data
npm run seed

# 4) run service
npm run dev

# 5) uji cepat
# health
curl http://localhost:3002/health
# list
curl http://localhost:3002/restaurants
# detail (ganti <id> dari hasil list)
curl http://localhost:3002/restaurants/<id>
```

---

## 9) Checklist Acceptance (untuk UTS)

* [ ] Service berjalan di **port 3002**
* [ ] `GET /restaurants` → `{status:"success", data:[...]}`
* [ ] `GET /restaurants/:id` → `{status:"success", data:{... menu:[]}}`
* [ ] **Seed data**: ≥3 restoran, masing-masing ≥5 menu
* [ ] Format respons **seragam** (success/error)
* [ ] **Swagger** lokal tersedia (opsional) / siap di-merge ke Gateway
* [ ] Koneksi stabil (tanpa crash)
* [ ] Siap diproxy oleh **API Gateway** via prefix `/restaurants/*`

---

## 10) Troubleshooting Cepat

* **Mongo ERR/ECONNREFUSED** → pastikan service MongoDB running; cek `MONGODB_URI`.
* **CastError ObjectId** → pastikan `:id` adalah `_id` Mongo valid dari hasil list.
* **Menu kosong** → cek seed sudah dijalankan & DB name sesuai `.env`.
* **CORS** → `app.use(cors())` sudah aktif; atur origin khusus bila perlu.
* **Port 3002 bentrok** → ubah `PORT` di `.env` lalu restart.

---

## 11) Catatan Integrasi Tim (nanti)

* Gateway mem-proxy: `/restaurants/*` → `http://localhost:3002`
* Order-service akan `GET /restaurants/:id` untuk ambil **menu** dan validasi `isAvailable` + hitung `totalPrice`.
* Pastikan format respons **seragam** agar mudah ditampilkan di frontend dan dinilai saat demo.
