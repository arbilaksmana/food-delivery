# Restaurant Service API Contract

Dokumentasi kontrak API untuk integrasi dengan service lain (order-service, user-service, API Gateway).

## Base Information

- **Service Name**: Restaurant Service
- **Base URL**: `http://localhost:3002`
- **Port**: `3002`
- **Version**: 1.0.0

## Response Format Standard

### Success Response
```json
{
  "status": "success",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description"
}
```

## Endpoints

### 1. Health Check

**Endpoint**: `GET /health`

**Description**: Check service health status

**Response (200)**:
```json
{
  "status": "ok"
}
```

---

### 2. List All Restaurants

**Endpoint**: `GET /restaurants`

**Description**: Get list of all restaurants with their menus

**Response (200)**:
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
          "createdAt": "2025-02-11T10:00:00.000Z",
          "updatedAt": "2025-02-11T10:00:00.000Z"
        }
      ],
      "createdAt": "2025-02-11T10:00:00.000Z",
      "updatedAt": "2025-02-11T10:00:00.000Z"
    }
  ]
}
```

**Use Case**: 
- Frontend: Display list of restaurants
- Order Service: Get available restaurants for order creation

---

### 3. Get Restaurant by ID

**Endpoint**: `GET /restaurants/:id`

**Description**: Get restaurant details including full menu

**Path Parameters**:
- `id` (string, required) - MongoDB ObjectId of restaurant

**Response (200)**:
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
        "createdAt": "2025-02-11T10:00:00.000Z",
        "updatedAt": "2025-02-11T10:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Mie Goreng",
        "description": "Jawa",
        "price": 17000,
        "isAvailable": true,
        "createdAt": "2025-02-11T10:00:00.000Z",
        "updatedAt": "2025-02-11T10:00:00.000Z"
      }
    ],
    "createdAt": "2025-02-11T10:00:00.000Z",
    "updatedAt": "2025-02-11T10:00:00.000Z"
  }
}
```

**Response (404)**:
```json
{
  "status": "error",
  "message": "Restaurant not found"
}
```

**Use Case**: 
- **Order Service**: Get restaurant menu to validate menu items and calculate prices
- **Frontend**: Display restaurant detail page

**Important for Order Service**:
- Validate `menu[].isAvailable === true` before allowing order
- Use `menu[]._id` as reference (not array index)
- Use `menu[].price` for price calculation

---

### 4. Create Restaurant

**Endpoint**: `POST /restaurants`

**Description**: Create new restaurant (admin/seed operation)

**Request Body**:
```json
{
  "name": "Restaurant Name",
  "address": "Restaurant Address",
  "menu": [
    {
      "name": "Menu Item Name",
      "description": "Menu description",
      "price": 20000,
      "isAvailable": true
    }
  ]
}
```

**Response (201)**:
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Restaurant Name",
    "address": "Restaurant Address",
    "menu": [...],
    "createdAt": "2025-02-11T10:00:00.000Z",
    "updatedAt": "2025-02-11T10:00:00.000Z"
  }
}
```

**Response (400)**:
```json
{
  "status": "error",
  "message": "Validation error message"
}
```

---

### 5. Add Menu Item

**Endpoint**: `POST /restaurants/:id/menu`

**Description**: Add menu item to existing restaurant

**Path Parameters**:
- `id` (string, required) - MongoDB ObjectId of restaurant

**Request Body**:
```json
{
  "name": "Menu Item Name",
  "description": "Menu description (optional)",
  "price": 20000,
  "isAvailable": true
}
```

**Response (201)**:
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Restaurant Name",
    "menu": [
      // ... existing menu items
      {
        "_id": "507f1f77bcf86cd799439020",
        "name": "Menu Item Name",
        "description": "Menu description",
        "price": 20000,
        "isAvailable": true,
        "createdAt": "2025-02-11T10:00:00.000Z",
        "updatedAt": "2025-02-11T10:00:00.000Z"
      }
    ]
  }
}
```

---

## Data Models

### Restaurant
```typescript
interface Restaurant {
  _id: string;              // MongoDB ObjectId
  name: string;             // Required
  address: string;           // Optional
  menu: MenuItem[];         // Array of menu items
  createdAt: Date;
  updatedAt: Date;
}
```

### MenuItem
```typescript
interface MenuItem {
  _id: string;              // MongoDB ObjectId (embedded document ID)
  name: string;             // Required
  description: string;      // Optional
  price: number;            // Required, min: 0
  isAvailable: boolean;     // Default: true
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Integration Guide

### For Order Service

**Scenario**: Validate menu items and get prices for order

```javascript
// Example: Get restaurant menu for order validation
async function validateOrderItems(restaurantId, orderItems) {
  // 1. Fetch restaurant data
  const response = await fetch(`http://localhost:3002/restaurants/${restaurantId}`);
  const result = await response.json();
  
  if (result.status !== 'success') {
    throw new Error('Restaurant not found');
  }
  
  const restaurant = result.data;
  let totalPrice = 0;
  
  // 2. Validate each order item
  for (const orderItem of orderItems) {
    const menuItem = restaurant.menu.find(
      item => item._id.toString() === orderItem.menuItemId
    );
    
    // Validate menu item exists
    if (!menuItem) {
      throw new Error(`Menu item ${orderItem.menuItemId} not found`);
    }
    
    // Validate menu item is available
    if (!menuItem.isAvailable) {
      throw new Error(`Menu item ${menuItem.name} is not available`);
    }
    
    // Calculate price
    totalPrice += menuItem.price * orderItem.quantity;
  }
  
  return {
    restaurantId: restaurant._id,
    restaurantName: restaurant.name,
    totalPrice,
    isValid: true
  };
}
```

**Key Points**:
- Always validate `isAvailable` before processing order
- Use `menu._id` as unique identifier (not array index)
- Calculate `totalPrice` using `menu.price` from restaurant service

### For API Gateway

**Configuration**:
```
/restaurants/* → http://localhost:3002/restaurants/*
```

**Example Gateway Route** (Express):
```javascript
app.use('/restaurants', proxy('http://localhost:3002/restaurants'));
```

**Swagger Merge**: 
Swagger documentation available at `http://localhost:3002/api-docs` can be merged into centralized gateway documentation.

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Internal Server Error |

All errors return:
```json
{
  "status": "error",
  "message": "Error description"
}
```

---

## Testing

### Quick Test with cURL

```bash
# Health check
curl http://localhost:3002/health

# List restaurants
curl http://localhost:3002/restaurants

# Get restaurant by ID
curl http://localhost:3002/restaurants/507f1f77bcf86cd799439011

# Create restaurant
curl -X POST http://localhost:3002/restaurants \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Restaurant","address":"Test Address","menu":[]}'
```

### Interactive Testing

Swagger UI available at: `http://localhost:3002/api-docs`

---

## Changelog

### Version 1.0.0
- Initial release
- All endpoints implemented
- Swagger documentation included

---

## Support

For questions or issues, contact the restaurant-service team.

