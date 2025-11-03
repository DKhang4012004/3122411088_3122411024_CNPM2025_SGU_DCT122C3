# 📮 HƯỚNG DẪN TEST ORDER FLOW VỚI POSTMAN

## 🎯 Mục đích
Test toàn bộ luồng đặt hàng bằng API calls thông qua Postman

---

## 📥 BƯỚC 1: IMPORT COLLECTION

### Cách 1: Import từ file
1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file: `Complete_Order_Flow_Test.postman_collection.json`
4. Click **Import**

### Cách 2: Import từ text
1. Mở Postman → **Import** → **Raw text**
2. Copy toàn bộ nội dung file JSON
3. Paste và click **Import**

✅ **Kết quả**: Collection "Complete Order Flow Test" xuất hiện trong sidebar

---

## ⚙️ BƯỚC 2: TẠO ENVIRONMENT

### Tạo Environment mới:
1. Click icon ⚙️ (Settings) → **Environments** → **Add**
2. Tên: `FoodFast Local`
3. Thêm các biến:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `base_url` | `http://localhost:8080/home` | `http://localhost:8080/home` |
| `auth_token` | (để trống) | (để trống) |
| `user_id` | (để trống) | (để trống) |
| `drone_code` | `DRONE001` | `DRONE001` |
| `store_id` | (để trống) | (để trống) |
| `store_name` | (để trống) | (để trống) |
| `product_id_1` | (để trống) | (để trống) |
| `product_id_2` | (để trống) | (để trống) |
| `order_id` | (để trống) | (để trống) |

4. Click **Save**
5. Chọn environment "FoodFast Local" từ dropdown (góc trên bên phải)

---

## 🗄️ BƯỚC 3: CHUẨN BỊ DỮ LIỆU

Chạy script insert data (nếu chưa có):
```bash
insert-test-data.bat
```

Hoặc:
```bash
mysql -u root -proot drone_delivery < insert-test-data.sql
```

---

## 🚀 BƯỚC 4: KHỞI ĐỘNG SERVER

```bash
start-server.bat
```

Đợi thông báo: **"Started FoodfastApplication"**

---

## 🧪 BƯỚC 5: CHẠY TEST

### ✅ Cách 1: Test tự động toàn bộ (Runner) ⭐

1. Click collection **"Complete Order Flow Test"**
2. Click nút **"Run"** (hoặc icon ▶️)
3. Trong Collection Runner:
   - Chọn environment: **FoodFast Local**
   - Delay: **500ms** (để tránh race condition)
4. Click **"Run Complete Order Flow Test"**

**Kết quả**: 
- Tất cả requests chạy tuần tự
- Tự động lưu token, store_id, product_id vào environment
- Xem kết quả pass/fail cho từng test

---

### 📋 Cách 2: Test thủ công từng bước

#### **1. Authentication**

**1.1 Login - Get Token**
```http
POST {{base_url}}/auth/login
Content-Type: application/json

{
    "username": "customer1",
    "password": "password123"
}
```

✅ **Expected**: 
- Status: 200 OK
- Token được tự động lưu vào `{{auth_token}}`
- User ID được lưu vào `{{user_id}}`

**1.2 Validate Token** (optional)
```http
POST {{base_url}}/auth/validate
Content-Type: application/json

{
    "token": "{{auth_token}}"
}
```

---

#### **2. Drone Setup**

**2.1 Register Drone**
```http
POST {{base_url}}/drones/register
Content-Type: application/json

{
    "code": "DRONE001",
    "model": "Postman Test Drone",
    "maxPayloadGram": 3000,
    "latitude": 10.762622,
    "longitude": 106.660172
}
```

✅ **Expected**: 
- Status: 200 OK (hoặc 400 nếu đã tồn tại - OK)
- Drone code: `DRONE001`
- Status: `AVAILABLE`
- Battery: `100%`

**2.2 Get Drone Info**
```http
GET {{base_url}}/drones/{{drone_code}}
```

---

#### **3. Browse Stores**

**3.1 Get All Stores**
```http
GET {{base_url}}/stores
```

✅ **Expected**:
- Status: 200 OK
- Trả về ít nhất 1 store
- `{{store_id}}` tự động lưu store đầu tiên

**Response example:**
```json
{
    "code": 1000,
    "result": [
        {
            "id": 1,
            "name": "Cơm Tấm Sài Gòn",
            "status": "OPEN",
            "rating": 4.5
        }
    ]
}
```

**3.2 Get Store by ID**
```http
GET {{base_url}}/stores/{{store_id}}
```

---

#### **4. View Products**

**4.1 Get Products by Store**
```http
GET {{base_url}}/products?storeId={{store_id}}
```

✅ **Expected**:
- Status: 200 OK
- Trả về danh sách sản phẩm
- `{{product_id_1}}` và `{{product_id_2}}` tự động lưu

**Response example:**
```json
{
    "code": 1000,
    "result": [
        {
            "id": 101,
            "name": "Cơm Tấm Sườn Bì Chả",
            "basePrice": 45000,
            "weightGram": 500,
            "quantityAvailable": 50
        }
    ]
}
```

---

#### **5. Shopping Cart**

⚠️ **Lưu ý**: Cart APIs cần authentication (Bearer Token)

**5.1 Add Product 1 to Cart**
```http
POST {{base_url}}/api/cart/add
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
    "productId": {{product_id_1}},
    "quantity": 2
}
```

**5.2 Add Product 2 to Cart**
```http
POST {{base_url}}/api/cart/add
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
    "productId": {{product_id_2}},
    "quantity": 1
}
```

**5.3 View Cart**
```http
GET {{base_url}}/api/cart
Authorization: Bearer {{auth_token}}
```

✅ **Expected**:
```json
{
    "cartId": 1,
    "items": [
        {
            "productId": 101,
            "productName": "Cơm Tấm Sườn Bì Chả",
            "quantity": 2,
            "unitPrice": 45000,
            "subtotal": 90000
        }
    ],
    "totalAmount": 90000
}
```

**5.4 Update Cart Item** (optional)
```http
PUT {{base_url}}/api/cart/products/{{product_id_1}}
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
    "quantity": 3
}
```

---

#### **6. Create Order (Simulated)**

⚠️ **Note**: OrderController chưa có, bước này simulated

**6.1 View Cart để chuẩn bị order**
```http
GET {{base_url}}/api/cart
Authorization: Bearer {{auth_token}}
```

Script tự động tạo `{{order_id}}` = `ORD-{timestamp}`

**Khi có OrderController, thay bằng:**
```http
POST {{base_url}}/orders/checkout
Authorization: Bearer {{auth_token}}
Content-Type: application/json

{
    "cartId": 1,
    "deliveryAddressId": 1,
    "paymentMethod": "CASH_ON_DELIVERY"
}
```

---

#### **7. Drone Delivery**

**7.1 Update Status - IN_FLIGHT**
```http
POST {{base_url}}/drones/{{drone_code}}/status
Content-Type: application/json

{
    "status": "IN_FLIGHT"
}
```

✅ **Expected**:
- Status: 200 OK
- Drone status: `IN_FLIGHT`

**7.2-7.6 Update GPS Location** (Chạy tuần tự)

Drone bay từ:
- Start: `(10.762622, 106.660172)` ← Cửa hàng
- End: `(10.773622, 106.670172)` ← Khách hàng

```http
# Step 1
POST {{base_url}}/drones/{{drone_code}}/location
Content-Type: application/json
{
    "latitude": 10.763222,
    "longitude": 106.660672,
    "batteryPercent": 95
}

# Step 2
POST {{base_url}}/drones/{{drone_code}}/location
Content-Type: application/json
{
    "latitude": 10.765822,
    "longitude": 106.663172,
    "batteryPercent": 90
}

# Step 3
POST {{base_url}}/drones/{{drone_code}}/location
Content-Type: application/json
{
    "latitude": 10.768422,
    "longitude": 106.665672,
    "batteryPercent": 85
}

# Step 4
POST {{base_url}}/drones/{{drone_code}}/location
Content-Type: application/json
{
    "latitude": 10.771022,
    "longitude": 106.668172,
    "batteryPercent": 82
}

# Step 5 (Arrived!)
POST {{base_url}}/drones/{{drone_code}}/location
Content-Type: application/json
{
    "latitude": 10.773622,
    "longitude": 106.670172,
    "batteryPercent": 80
}
```

**7.7 Check Drone Health**
```http
GET {{base_url}}/drones/{{drone_code}}/health
```

✅ **Expected**:
```json
{
    "droneCode": "DRONE001",
    "batteryLevel": 80,
    "batteryHealth": "GOOD",
    "connectionHealth": "GOOD",
    "overallHealth": "HEALTHY"
}
```

---

#### **8. Complete Delivery**

**8.1 Update Status - AVAILABLE**
```http
POST {{base_url}}/drones/{{drone_code}}/status
Content-Type: application/json

{
    "status": "AVAILABLE"
}
```

✅ **Expected**:
- Status: 200 OK
- Drone status: `AVAILABLE`
- Battery: `80%`

**8.2 Verify Final Status**
```http
GET {{base_url}}/drones/{{drone_code}}
```

---

#### **9. Cleanup** (Optional)

**9.1 Clear Cart**
```http
DELETE {{base_url}}/api/cart/clear
Authorization: Bearer {{auth_token}}
```

**9.2 Logout**
```http
POST {{base_url}}/auth/logout
Content-Type: application/json

{
    "token": "{{auth_token}}"
}
```

---

## 📊 KIỂM TRA KẾT QUẢ

### ✅ Test thành công khi:

**1. Authentication:**
- [x] Login trả về token
- [x] Token được lưu vào environment

**2. Drone Setup:**
- [x] Drone registered (hoặc already exists)
- [x] Status: AVAILABLE
- [x] Battery: 100%

**3. Browse & Select:**
- [x] Có ít nhất 1 store
- [x] Store có sản phẩm
- [x] Product có price, weight

**4. Cart Operations:**
- [x] Thêm sản phẩm thành công
- [x] Cart hiển thị đúng items
- [x] Tính tổng tiền đúng

**5. Drone Delivery:**
- [x] Status: AVAILABLE → IN_FLIGHT
- [x] GPS updates (5 lần)
- [x] Battery giảm dần (100% → 80%)
- [x] Đến đúng điểm giao hàng

**6. Complete:**
- [x] Status: IN_FLIGHT → AVAILABLE
- [x] Health check: HEALTHY

---

## 🎯 POSTMAN TESTS

Collection đã tích hợp sẵn tests tự động:

### Test Scripts có sẵn:

**1. Login:**
```javascript
// Save token to environment
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("auth_token", jsonData.result.token);
}
```

**2. Get Stores:**
```javascript
// Save first store
if (jsonData.result.length > 0) {
    pm.environment.set("store_id", jsonData.result[0].id);
}
```

**3. Get Products:**
```javascript
// Save products for cart
pm.environment.set("product_id_1", jsonData.result[0].id);
pm.environment.set("product_id_2", jsonData.result[1].id);
```

**4. Drone Status:**
```javascript
pm.test("Drone status updated", function () {
    pm.expect(jsonData.result.status).to.eql("IN_FLIGHT");
});
```

---

## 🔄 CHẠY LẠI TEST

### Reset environment:
1. Click icon ⚙️ → Environments → FoodFast Local
2. Click **Reset All** (hoặc xóa các Current Values)
3. Chạy lại từ đầu

### Hoặc dùng Cleanup:
1. Chạy folder **"9. Cleanup"**
2. Clear cart
3. Logout
4. Chạy lại từ Authentication

---

## 📱 TEST TRÊN NHIỀU ENVIRONMENT

### Tạo thêm environments:

**Production:**
```
base_url: https://api.foodfast.com
```

**Staging:**
```
base_url: https://staging.foodfast.com
```

**Phone (LAN):**
```
base_url: http://192.168.1.86:8080/home
```

Chuyển đổi bằng dropdown góc trên phải.

---

## 🐛 TROUBLESHOOTING

### ❌ Error: Unauthorized (401)
**Nguyên nhân**: Token hết hạn hoặc chưa login  
**Giải pháp**: Chạy lại **1.1 Login** để lấy token mới

### ❌ Error: No stores found
**Nguyên nhân**: Database chưa có dữ liệu  
**Giải pháp**: `insert-test-data.bat`

### ❌ Error: Connection refused
**Nguyên nhân**: Server chưa khởi động  
**Giải pháp**: `start-server.bat`

### ❌ Error: Product not available
**Nguyên nhân**: Sản phẩm hết hàng hoặc không active  
**Giải pháp**: Check database hoặc chọn product khác

---

## 💡 TIPS & TRICKS

### 1. Xem Variables
- Click icon 👁️ (eye) góc trên phải
- Xem tất cả variables đã lưu

### 2. Debug Request
- Click request → **Console** (bottom)
- Xem raw request/response

### 3. Copy cURL
- Click request → **Code** → **cURL**
- Copy để chạy trong terminal

### 4. Export Results
- Collection Runner → **Export Results**
- Lưu thành JSON để báo cáo

### 5. Automation
- Export collection
- Run with Newman (CLI tool):
```bash
newman run Complete_Order_Flow_Test.postman_collection.json \
  -e FoodFast_Local.postman_environment.json
```

---

## 📈 SO SÁNH: POSTMAN vs HTML TEST PAGE

| Feature | Postman | HTML Test Page |
|---------|---------|----------------|
| **Setup** | Import + Environment | Open browser |
| **Speed** | ⚡ Nhanh (API trực tiếp) | 🐢 Chậm hơn (UI rendering) |
| **Debug** | ✅ Chi tiết (Console, Headers) | ✅ Visual (Log, Map) |
| **Auto** | ✅ Runner + Newman CLI | ✅ 1-click button |
| **Manual** | ✅ Click từng request | ✅ Click từng bước |
| **Visual** | ❌ Chỉ JSON | ✅ Map, animations |
| **CI/CD** | ✅ Newman integration | ❌ Khó tích hợp |

**Khuyến nghị:**
- **Postman**: Cho developers, testing APIs, automation
- **HTML Page**: Cho demo, visual testing, non-technical users

---

## 🎓 TỔNG KẾT

### ✅ Đã có:
- [x] Complete Postman collection (9 folders, 25+ requests)
- [x] Auto-save variables (token, IDs)
- [x] Test scripts tích hợp
- [x] Collection Runner support
- [x] Environment variables

### 🚀 Có thể làm:
- Test từng API riêng lẻ
- Test toàn bộ flow tự động
- Debug chi tiết
- Export results
- CI/CD integration

### 📝 Khi nào dùng:
- ✅ Test API logic
- ✅ Debug backend
- ✅ Automation testing
- ✅ Performance testing
- ✅ Documentation

---

## 📞 QUICK START

```bash
# 1. Import collection vào Postman
File: Complete_Order_Flow_Test.postman_collection.json

# 2. Tạo environment "FoodFast Local"
base_url: http://localhost:8080/home

# 3. Start server
start-server.bat

# 4. Chạy Collection Runner
- Chọn collection
- Click Run
- Set delay: 500ms
- Run!

# Hoặc chạy với Newman CLI:
npm install -g newman
newman run Complete_Order_Flow_Test.postman_collection.json
```

**Thời gian**: < 10 giây cho toàn bộ flow! ⚡

---

📝 **Created**: 2025-11-03  
🔄 **Last Updated**: 2025-11-03  
👨‍💻 **Project**: FoodFast  
📮 **Collection**: Complete Order Flow Test

