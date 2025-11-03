# 📋 API ENDPOINTS - COMPLETE MAPPING

## ✅ ĐÃ SỬA - NGÀY 3/11/2025

### Vấn đề:
- Endpoints trong `config.js` không khớp với backend controllers
- Toast và Loading bị duplicate declaration
- Orders không load được

### Giải pháp:
1. ✅ Sửa PRODUCTS endpoint: `/api/v1/products` → `/products`
2. ✅ Xóa duplicate Toast và Loading trong orders.js
3. ✅ Đổi BASE_URL sang dynamic: `window.location.origin + '/home'`

---

## 🎯 BACKEND API ENDPOINTS (ACTUAL)

### 1. Authentication (`/auth`)
```java
@RestController
@RequestMapping("/auth")
```
- `POST /auth/signup` - Đăng ký
- `POST /auth/login` - Đăng nhập
- `POST /auth/logout` - Đăng xuất
- `POST /auth/validate` - Validate token
- `POST /auth/refresh` - Refresh token

### 2. Stores (`/api/stores`)
```java
@RestController
@RequestMapping("/api/stores")
```
- `GET /api/stores` - Lấy tất cả stores
- `GET /api/stores/{storeId}` - Lấy store theo ID
- `POST /api/stores` - Tạo store mới
- `PUT /api/stores/{storeId}` - Cập nhật store
- `DELETE /api/stores/{storeId}` - Xóa store
- `GET /api/stores/owner/{ownerUserId}` - Lấy stores theo owner

### 3. Products (`/products`)
```java
@RestController
@RequestMapping("/products")
```
- `GET /products` - Lấy tất cả products
- `GET /products/{id}` - Lấy product theo ID
- `GET /products/store/{storeId}` - Lấy products theo store ⭐
- `GET /products/category/{categoryId}` - Lấy products theo category
- `GET /products/search?keyword=...` - Tìm kiếm products
- `POST /products` - Tạo product mới
- `PUT /products/{id}` - Cập nhật product
- `DELETE /products/{id}` - Xóa product

### 4. Cart (`/api/cart`)
```java
@RestController
@RequestMapping("/api/cart")
```
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/cart/add` - Thêm vào giỏ hàng
- `PUT /api/cart/products/{productId}` - Cập nhật số lượng
- `DELETE /api/cart/products/{productId}` - Xóa sản phẩm
- `DELETE /api/cart/clear` - Xóa toàn bộ giỏ hàng
- `GET /api/cart/count` - Đếm số lượng items

### 5. Orders (`/api/v1/orders`)
```java
@RestController
@RequestMapping("/api/v1/orders")
```
- `POST /api/v1/orders` - Tạo order từ cart
- `GET /api/v1/orders/{orderId}` - Lấy order theo ID
- `GET /api/v1/orders/code/{orderCode}` - Lấy order theo code
- `GET /api/v1/orders/user/{userId}` - Lấy orders theo user ⭐
- `GET /api/v1/orders/store/{storeId}` - Lấy orders theo store
- `POST /api/v1/orders/{orderId}/cancel` - Hủy order

### 6. Payments (`/api/v1/payments`)
```java
@RestController
@RequestMapping("/api/v1/payments")
```
- `POST /api/v1/payments/init` - Khởi tạo thanh toán ⭐
- `GET /api/v1/payments/vnpay-ipn` - VNPay IPN callback
- `GET /api/v1/payments/vnpay-return` - VNPay return URL

### 7. Deliveries (`/api/v1/deliveries`)
```java
@RestController
@RequestMapping("/api/v1/deliveries")
```
- `GET /api/v1/deliveries/order/{orderId}` - Lấy delivery theo order ⭐
- `PUT /api/v1/deliveries/{deliveryId}/status` - Cập nhật trạng thái
- `PUT /api/v1/deliveries/{deliveryId}/location` - Cập nhật vị trí

### 8. Drones (`/drones`)
```java
@RestController
@RequestMapping("/drones")
```
- `GET /drones` - Lấy tất cả drones
- `GET /drones/{code}` - Lấy drone theo code
- `GET /drones/{code}/location` - Lấy vị trí drone
- `POST /drones` - Tạo drone mới
- `PUT /drones/{code}` - Cập nhật drone

---

## 🔧 FRONTEND CONFIG.JS (FIXED)

```javascript
const API_CONFIG = {
    // Dynamic BASE_URL - works with localhost and ngrok
    BASE_URL: window.location.origin + '/home',
    
    ENDPOINTS: {
        // Authentication
        LOGIN: '/auth/login',                                    ✅
        REGISTER: '/auth/signup',                                ✅

        // Stores
        STORES: '/api/stores',                                   ✅
        STORE_BY_ID: (id) => `/api/stores/${id}`,              ✅

        // Products
        PRODUCTS_BY_STORE: (storeId) => `/products/store/${storeId}`,  ✅
        PRODUCTS: '/products',                                   ✅ FIXED!

        // Cart
        CART: '/api/cart',                                       ✅
        CART_ADD: '/api/cart/add',                              ✅
        CART_UPDATE: (productId) => `/api/cart/products/${productId}`,  ✅
        CART_REMOVE: (productId) => `/api/cart/products/${productId}`,  ✅
        CART_CLEAR: '/api/cart/clear',                          ✅
        CART_COUNT: '/api/cart/count',                          ✅

        // Orders
        ORDERS: '/api/v1/orders',                                ✅
        ORDER_BY_ID: (id) => `/api/v1/orders/${id}`,           ✅
        ORDER_BY_CODE: (code) => `/api/v1/orders/code/${code}`, ✅
        USER_ORDERS: (userId) => `/api/v1/orders/user/${userId}`,  ✅

        // Payment
        PAYMENT_INIT: '/api/v1/payments/init',                  ✅

        // Delivery
        DELIVERY_BY_ORDER: (orderId) => `/api/v1/deliveries/order/${orderId}`,  ✅

        // Drones
        DRONES: '/drones',                                       ✅
        DRONE_BY_CODE: (code) => `/drones/${code}`,            ✅
        DRONE_LOCATION: (code) => `/drones/${code}/location`   ✅
    }
};
```

---

## 🎯 FULL URL EXAMPLES

### Development (Localhost):
```
Base: http://localhost:8080/home

Login:          http://localhost:8080/home/auth/login
Stores:         http://localhost:8080/home/api/stores
Products:       http://localhost:8080/home/products
Products by Store: http://localhost:8080/home/products/store/1
Cart:           http://localhost:8080/home/api/cart
Orders:         http://localhost:8080/home/api/v1/orders
User Orders:    http://localhost:8080/home/api/v1/orders/user/2
Payment:        http://localhost:8080/home/api/v1/payments/init
```

### Production/Ngrok:
```
Base: https://xxx.ngrok-free.dev/home

Login:          https://xxx.ngrok-free.dev/home/auth/login
Stores:         https://xxx.ngrok-free.dev/home/api/stores
Products:       https://xxx.ngrok-free.dev/home/products
...
```

---

## ⚠️ COMMON MISTAKES

### ❌ WRONG:
```javascript
// Hardcoded localhost
BASE_URL: 'http://localhost:8080/home'

// Wrong product path
PRODUCTS: '/api/v1/products'  // Backend is just /products

// Missing /api prefix
STORES: '/stores'  // Backend is /api/stores

// Wrong orders path
ORDERS: '/orders'  // Backend is /api/v1/orders
```

### ✅ CORRECT:
```javascript
// Dynamic URL
BASE_URL: window.location.origin + '/home'

// Correct paths matching backend
PRODUCTS: '/products'
STORES: '/api/stores'
ORDERS: '/api/v1/orders'
```

---

## 🧪 TESTING ENDPOINTS

### Test với curl:
```bash
# 1. Login
curl -X POST http://localhost:8080/home/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'

# 2. Get Stores
curl http://localhost:8080/home/api/stores

# 3. Get Products by Store
curl http://localhost:8080/home/products/store/1

# 4. Get User Orders (need token)
curl http://localhost:8080/home/api/v1/orders/user/2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test với Postman:
```
Collection: Complete_Order_Flow_Test.postman_collection.json
Environment: 
  - base_url: http://localhost:8080/home
  - token: {{token}}
  - userId: {{userId}}
```

---

## 📊 ENDPOINT MAPPING TABLE

| Feature | Frontend Endpoint | Backend Controller | Match |
|---------|------------------|-------------------|-------|
| Login | `/auth/login` | `@RequestMapping("/auth")` | ✅ |
| Stores | `/api/stores` | `@RequestMapping("/api/stores")` | ✅ |
| Products | `/products` | `@RequestMapping("/products")` | ✅ |
| Products by Store | `/products/store/{id}` | `@GetMapping("/store/{storeId}")` | ✅ |
| Cart | `/api/cart` | `@RequestMapping("/api/cart")` | ✅ |
| Orders | `/api/v1/orders` | `@RequestMapping("/api/v1/orders")` | ✅ |
| Payment | `/api/v1/payments/init` | `@PostMapping("/init")` | ✅ |
| Delivery | `/api/v1/deliveries` | `@RequestMapping("/api/v1/deliveries")` | ✅ |

---

## 🔍 DEBUGGING

### Check if endpoint is correct:
```javascript
// Console
console.log('Full URL:', API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.PRODUCTS);
// Should be: http://localhost:8080/home/products
```

### Test API call:
```javascript
// Console
APIHelper.get(API_CONFIG.ENDPOINTS.PRODUCTS)
    .then(r => console.log('Products:', r))
    .catch(e => console.error('Error:', e));
```

### Check Network tab:
```
F12 → Network → XHR
Request URL: http://localhost:8080/home/products
Status: 200 OK ✅
```

---

## ✅ FIXES APPLIED

### 1. PRODUCTS endpoint:
```javascript
// Before: '/api/v1/products'
// After:  '/products'
```

### 2. BASE_URL dynamic:
```javascript
// Before: 'http://localhost:8080/home'
// After:  window.location.origin + '/home'
```

### 3. Remove duplicates:
```javascript
// Removed from orders.js:
// - const Toast = { ... }
// - const Loading = { ... }
// (Already defined in config.js)
```

---

## 🎉 RESULT

**All endpoints now match backend controllers!**

- ✅ Stores load correctly
- ✅ Products load correctly
- ✅ Orders load correctly
- ✅ Cart works
- ✅ Payment works
- ✅ No duplicate declarations
- ✅ Works with localhost AND ngrok

---

**Status:** ✅ FIXED
**Date:** November 3, 2025
**Files Updated:** 
- `config.js` (both folders)
- `orders.js` (both folders)

