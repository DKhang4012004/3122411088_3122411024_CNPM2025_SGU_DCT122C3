# 📮 POSTMAN QUICK REFERENCE

## 🚀 5-MINUTE SETUP

### 1️⃣ Import Collection
```
File → Import → Complete_Order_Flow_Test.postman_collection.json
```

### 2️⃣ Create Environment
```
Name: FoodFast Local
Variable: base_url = http://localhost:8080/home
```

### 3️⃣ Start Server
```bash
start-server.bat
```

### 4️⃣ Run Tests
```
Collection → Run → Set delay 500ms → Run
```

---

## 📋 API ENDPOINTS QUICK LIST

### Authentication
```http
POST /auth/login           # Login & get token
POST /auth/validate        # Validate token
POST /auth/logout          # Logout
```

### Drones
```http
POST /drones/register                # Register drone
GET  /drones                         # Get all drones
GET  /drones/{code}                  # Get drone info
POST /drones/{code}/status           # Update status
POST /drones/{code}/location         # Update GPS
GET  /drones/{code}/health           # Check health
GET  /drones/{code}/current-delivery # Get current delivery
```

### Stores
```http
GET /stores           # Get all stores
GET /stores/{id}      # Get store detail
```

### Products
```http
GET /products                 # Get all products
GET /products?storeId={id}    # Get products by store
GET /products/{id}            # Get product detail
```

### Cart (Need Auth)
```http
POST   /api/cart/add                  # Add to cart
GET    /api/cart                      # View cart
PUT    /api/cart/products/{productId} # Update quantity
DELETE /api/cart/products/{productId} # Remove item
DELETE /api/cart/clear                # Clear cart
GET    /api/cart/count                # Get item count
```

---

## 🎯 TEST FLOW SEQUENCE

```
1. Login (get token)
   ↓
2. Register Drone
   ↓
3. Get Stores (save store_id)
   ↓
4. Get Products (save product_ids)
   ↓
5. Add to Cart (product 1)
   ↓
6. Add to Cart (product 2)
   ↓
7. View Cart
   ↓
8. Update Drone → IN_FLIGHT
   ↓
9. Update Location (5 times)
   ↓
10. Update Drone → AVAILABLE
    ↓
Done! ✅
```

---

## 🔑 ENVIRONMENT VARIABLES

Auto-saved by tests:
- `{{auth_token}}` - JWT token from login
- `{{user_id}}` - User ID
- `{{drone_code}}` - Drone code (DRONE001)
- `{{store_id}}` - Selected store ID
- `{{product_id_1}}` - First product
- `{{product_id_2}}` - Second product
- `{{order_id}}` - Order ID (simulated)

---

## 📊 EXAMPLE REQUESTS

### Login
```json
POST {{base_url}}/auth/login
{
    "username": "customer1",
    "password": "password123"
}
```

### Register Drone
```json
POST {{base_url}}/drones/register
{
    "code": "DRONE001",
    "model": "Test Drone",
    "maxPayloadGram": 3000,
    "latitude": 10.762622,
    "longitude": 106.660172
}
```

### Add to Cart
```json
POST {{base_url}}/api/cart/add
Authorization: Bearer {{auth_token}}
{
    "productId": 101,
    "quantity": 2
}
```

### Update Drone GPS
```json
POST {{base_url}}/drones/DRONE001/location
{
    "latitude": 10.773622,
    "longitude": 106.670172,
    "batteryPercent": 80
}
```

---

## ✅ SUCCESS CRITERIA

### ✓ Authentication
- Login returns token (200)
- Token saved to environment

### ✓ Drone
- Registered (200 or 400 if exists)
- Status: AVAILABLE → IN_FLIGHT → AVAILABLE
- Battery: 100% → 80%

### ✓ Store & Products
- At least 1 store found
- Store has products
- Products have price & weight

### ✓ Cart
- Items added successfully
- Cart shows correct total
- Count matches items

### ✓ Delivery
- 5 GPS updates successful
- Arrived at destination
- Health check: HEALTHY

---

## 🐛 COMMON ERRORS

| Error | Fix |
|-------|-----|
| 401 Unauthorized | Run "1.1 Login" to get new token |
| 404 Not Found | Check base_url in environment |
| Connection refused | Start server: `start-server.bat` |
| No stores found | Run: `insert-test-data.bat` |
| Drone already exists | ✅ OK! Script will use existing |

---

## 💡 PRO TIPS

### Test Individual APIs
```
Click request → Send
```

### Test Complete Flow
```
Collection → Run → Run Complete Order Flow Test
```

### Debug
```
Console (bottom) → View request/response
```

### Export Results
```
Runner → Export Results → Save JSON
```

### Run with CLI
```bash
npm install -g newman
newman run Complete_Order_Flow_Test.postman_collection.json
```

---

## 📈 PERFORMANCE

| Metric | Value |
|--------|-------|
| Total Requests | 25+ |
| Complete Flow Time | ~10 seconds |
| With delay (500ms) | ~15 seconds |
| Manual Testing | ~5 minutes |

---

## 🎓 WHEN TO USE

### ✅ Use Postman when:
- Testing API logic
- Debugging backend
- Automation testing
- CI/CD integration
- Documentation

### ✅ Use HTML Page when:
- Demo for non-technical users
- Visual tracking needed
- Quick manual testing
- Showing to stakeholders

---

## 📞 QUICK COMMANDS

### Full Automation
```bash
# CLI with Newman
newman run Complete_Order_Flow_Test.postman_collection.json \
  --environment FoodFast_Local.postman_environment.json \
  --delay-request 500
```

### Export Environment
```bash
# In Postman
Environment → ⋯ → Export
```

### Share Collection
```bash
# In Postman
Collection → ⋯ → Share → Get Link
```

---

## 📚 FILES

- `Complete_Order_Flow_Test.postman_collection.json` - Collection
- `POSTMAN_TEST_GUIDE.md` - Full guide
- `POSTMAN_QUICK_REFERENCE.md` - This file
- `insert-test-data.sql` - Test data

---

## 🎯 CHEATSHEET

```bash
# 1. Setup (once)
import collection → create environment → insert data

# 2. Every test session
start server → run collection → check results

# 3. Debug
click request → send → view console

# 4. Cleanup
clear cart → logout → reset environment
```

---

📝 **Quick Reference**  
🚀 **Total time**: 5 minutes setup + 10 seconds test  
✅ **Ready to use!**

