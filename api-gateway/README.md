# API Gateway

API Gateway untuk Food Delivery System yang melakukan routing, authentication, dan rate limiting untuk semua microservices.

## Fitur

- ✅ JWT Authentication middleware
- ✅ Request routing ke microservices
- ✅ Rate limiting
- ✅ CORS support
- ✅ Swagger documentation gabungan
- ✅ Health check endpoint

## Struktur

```
api-gateway/
├── src/
│   ├── index.js          # Main gateway server
│   ├── middleware/
│   │   └── auth.js      # JWT authentication middleware
│   └── swagger.js        # Swagger configuration
├── package.json
└── .env
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Buat file `.env`:
```env
PORT=3000
JWT_SECRET=supersecret_shared_key
USER_SERVICE_TARGET=http://localhost:3001
RESTAURANT_SERVICE_TARGET=http://localhost:3002
ORDER_SERVICE_TARGET=http://localhost:3003
FRONTEND_URL=http://localhost:3000
```

3. Start gateway:
```bash
npm run dev
# atau
npm start
```

## Routing

| Gateway Route | Target Service | Auth Required |
|--------------|----------------|---------------|
| `/auth/register` | user-service `/users/register` | ❌ |
| `/auth/login` | user-service `/users/login` | ❌ |
| `/users/:id` | user-service `/users/:id` | ❌ |
| `/restaurants` | restaurant-service `/restaurants` | ❌ |
| `/orders` | order-service `/orders` | ✅ |
| `/orders/user/:userId` | order-service `/orders/user/:userId` | ✅ |

## Authentication

Untuk endpoint yang memerlukan authentication, gunakan header:
```
Authorization: Bearer <JWT_TOKEN>
```

Token diperoleh dari endpoint `/auth/login`.

## Swagger Documentation

Buka: `http://localhost:3000/api-docs`

## Environment Variables

- `PORT` - Port untuk API Gateway (default: 3000)
- `JWT_SECRET` - Secret key untuk JWT verification (harus sama dengan user-service)
- `USER_SERVICE_TARGET` - URL user-service (default: http://localhost:3001)
- `RESTAURANT_SERVICE_TARGET` - URL restaurant-service (default: http://localhost:3002)
- `ORDER_SERVICE_TARGET` - URL order-service (default: http://localhost:3003)
- `FRONTEND_URL` - URL frontend untuk CORS (default: *)

## Testing

```bash
# Health check
curl http://localhost:3000/health

# Register (via gateway)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"pass123","address":"123 St"}'

# Login (via gateway)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# Get restaurants (via gateway)
curl http://localhost:3000/restaurants

# Create order (via gateway - requires auth)
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"userId":"...","restaurantId":"...","items":[...]}'
```

