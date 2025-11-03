# 🧪 HƯỚNG DẪN TEST LUỒNG ĐẶT HÀNG HOÀN CHỈNH

## 🎯 Mục đích
Test toàn bộ luồng từ lúc khách hàng đặt hàng → drone giao hàng → khách nhận hàng

---

## 🚀 CÁCH 1: TEST TỰ ĐỘNG (Khuyến nghị)

### Bước 1: Khởi động server
```bash
# Windows
start-server.bat

# Hoặc
mvnw.cmd spring-boot:run
```

### Bước 2: Mở test page
Sau khi server khởi động xong, truy cập:
```
http://localhost:8080/home/test-complete-order-flow.html
```

### Bước 3: Chạy test tự động
1. Click nút **"🚀 CHẠY TOÀN BỘ LUỒNG TỰ ĐỘNG"**
2. Hệ thống sẽ tự động:
   - ✅ Đăng ký drone
   - ✅ Lấy danh sách cửa hàng
   - ✅ Chọn cửa hàng đầu tiên
   - ✅ Xem sản phẩm
   - ✅ Thêm 2 sản phẩm vào giỏ
   - ✅ Xem giỏ hàng
   - ✅ Tạo đơn hàng (simulated)
   - ✅ Drone giao hàng (bay từ A → B)
   - ✅ Hoàn thành giao hàng

### Kết quả mong đợi:
```
[10:30:15] ✅ Drone DRONE001 đã đăng ký thành công
[10:30:16] ✅ Tìm thấy 3 cửa hàng
[10:30:17] ✅ Đã chọn: Cơm Tấm Sài Gòn
[10:30:18] ✅ Tìm thấy 5 sản phẩm
[10:30:19] 🛒 Đã thêm: Cơm Tấm Sườn Bì Chả
[10:30:20] 🛒 Đã thêm: Cơm Tấm Bì
[10:30:21] ✅ Giỏ hàng: 2 sản phẩm, tổng: 105,000₫
[10:30:23] ✅ Đơn hàng ORD-1730620823000 đã được tạo
[10:30:25] ✈️ Drone DRONE001 đang bay đến điểm giao hàng
[10:30:26] 📍 Drone: (10.763, 106.661) - Pin: 99%
[10:30:27] 📍 Drone: (10.764, 106.662) - Pin: 98%
...
[10:30:31] 🎯 Drone đã đến điểm giao hàng!
[10:30:32] 🎉 Giao hàng thành công!
```

---

## 🎮 CÁCH 2: TEST THU CÔNG (Chi tiết từng bước)

### Bước 1: Khởi tạo Drone
1. Click nút **"Bắt đầu"** ở bước 1
2. Đợi drone đăng ký thành công
3. Kiểm tra log: `✅ Drone DRONE001 đã đăng ký thành công`

### Bước 2: Xem danh sách cửa hàng
1. Click nút **"Thực hiện"** ở bước 2
2. Danh sách cửa hàng sẽ hiển thị
3. **Click chọn một cửa hàng** (ví dụ: Cơm Tấm Sài Gòn)
4. Cửa hàng được chọn sẽ có viền xanh

### Bước 3: Xem sản phẩm & Thêm vào giỏ
1. Click nút **"Thực hiện"** ở bước 3
2. Danh sách sản phẩm hiển thị
3. Click **"Thêm vào giỏ"** cho các sản phẩm bạn muốn mua
4. Mỗi lần thêm sẽ có log: `🛒 Đã thêm: [Tên sản phẩm]`

### Bước 4: Xem giỏ hàng
1. Click nút **"Thực hiện"** ở bước 4
2. Giỏ hàng hiển thị với:
   - Danh sách sản phẩm đã chọn
   - Số lượng (có thể tăng/giảm bằng nút +/-)
   - Tổng tiền hàng
   - Phí vận chuyển
   - Tổng thanh toán
3. Bạn có thể:
   - **Tăng/giảm số lượng**: Click nút +/-
   - **Xóa sản phẩm**: Click nút × (màu đỏ)

### Bước 5: Tạo đơn hàng
1. Click nút **"Đặt hàng"** ở bước 5
2. Đơn hàng sẽ được tạo với status = PAID
3. Hiển thị:
   - Mã đơn hàng (ví dụ: ORD-1730620823000)
   - Tổng tiền
   - Trọng lượng
   - Trạng thái: PAID

### Bước 6: Drone giao hàng
1. Click nút **"Bắt đầu giao"** ở bước 6
2. Drone sẽ tự động:
   - Chuyển status sang IN_FLIGHT
   - Bay từ điểm A (cửa hàng) → điểm B (khách hàng)
   - Cập nhật GPS mỗi 300ms
   - Pin giảm dần từ 100% → 80%
3. Theo dõi:
   - **Map View**: Hiển thị vị trí drone realtime
   - **Log**: Cập nhật GPS liên tục
   - Progress: 0% → 100%

### Bước 7: Hoàn thành giao hàng
1. Click nút **"Hoàn thành"** ở bước 7
2. Hệ thống:
   - Đổi status đơn hàng → DELIVERED
   - Đổi status drone → AVAILABLE
   - Hiển thị thông báo thành công
3. Có nút **"Test lại từ đầu"** để chạy lại

---

## 📊 LUỒNG DỮ LIỆU

### 1. Drone Registration
```
POST /home/drones/register
{
  "code": "DRONE001",
  "model": "Test Delivery Drone",
  "maxPayloadGram": 3000,
  "latitude": 10.762622,
  "longitude": 106.660172
}

→ Response:
{
  "code": 1000,
  "result": {
    "code": "DRONE001",
    "status": "AVAILABLE",
    "currentBatteryPercent": 100
  }
}
```

### 2. Get Stores
```
GET /home/stores

→ Response:
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

### 3. Get Products
```
GET /home/products?storeId=1

→ Response:
{
  "code": 1000,
  "result": [
    {
      "id": 101,
      "name": "Cơm Tấm Sườn Bì Chả",
      "basePrice": 45000,
      "weightGram": 500,
      "quantityAvailable": 20
    }
  ]
}
```

### 4. Cart Operations (Simulated)
```javascript
// Client-side cart management
cart = [
  {
    productId: 101,
    productName: "Cơm Tấm Sườn Bì Chả",
    price: 45000,
    weight: 500,
    quantity: 2
  }
]

totalAmount = 90000
shippingFee = 15000
total = 105000
```

### 5. Create Order (Simulated)
```javascript
orderData = {
  orderId: "ORD-1730620823000",
  storeId: 1,
  storeName: "Cơm Tấm Sài Gòn",
  items: [...cart],
  totalAmount: 90000,
  shippingFee: 15000,
  total: 105000,
  totalWeight: 1000,
  status: "PAID"
}
```

### 6. Drone Delivery
```
POST /home/drones/DRONE001/status
{ "status": "IN_FLIGHT" }

Loop 20 times (300ms interval):
  POST /home/drones/DRONE001/location
  {
    "latitude": 10.762622 + step,
    "longitude": 106.660172 + step,
    "batteryPercent": 100 - (step * 1)
  }
```

### 7. Complete Delivery
```
POST /home/drones/DRONE001/status
{ "status": "AVAILABLE" }

Order status: PAID → DELIVERED
Drone status: IN_FLIGHT → AVAILABLE
```

---

## 🎨 GIAO DIỆN

### Màn hình chính:
```
+----------------------------------+
|  🍔 Test Complete Order Flow     |
+----------------------------------+
|  ⚙️ Cấu hình                     |
|  - API URL                       |
|  - Auth Token (optional)         |
+----------------------------------+
|  📋 Luồng đặt hàng               |
|  1️⃣ Khởi tạo Drone    [Bắt đầu] |
|  2️⃣ Xem cửa hàng      [Thực hiện]|
|  3️⃣ Xem sản phẩm      [Thực hiện]|
|  4️⃣ Xem giỏ hàng      [Thực hiện]|
|  5️⃣ Tạo đơn hàng      [Đặt hàng] |
|  6️⃣ Drone giao hàng   [Bắt đầu] |
|  7️⃣ Hoàn thành        [Hoàn thành]|
|  [🚀 CHẠY TỰ ĐỘNG TOÀN BỘ]      |
+----------------------------------+
|  📦 Dữ liệu                      |
|  (Hiển thị store/product/cart)   |
+----------------------------------+
|  🗺️ Vị trí Drone                 |
|  🚁 Drone đang bay...            |
|  📍 (10.765, 106.663)            |
|  🔋 95%                          |
+----------------------------------+
|  📋 Log                          |
|  [10:30:15] ✅ Drone registered  |
|  [10:30:16] 🛒 Added product    |
|  [10:30:17] 📍 Flying...        |
+----------------------------------+
```

---

## ✅ CHECKLIST TEST

### Trước khi test:
- [ ] Server đã khởi động (port 8080)
- [ ] Database đã có dữ liệu (stores, products)
- [ ] Trình duyệt đã mở test page

### Trong quá trình test:
- [ ] Drone đăng ký thành công
- [ ] Có ít nhất 1 cửa hàng hiển thị
- [ ] Cửa hàng có sản phẩm
- [ ] Thêm sản phẩm vào giỏ thành công
- [ ] Giỏ hàng tính toán đúng
- [ ] Đơn hàng được tạo với status PAID
- [ ] Drone bay từ A → B (20 bước)
- [ ] GPS cập nhật liên tục
- [ ] Pin giảm dần
- [ ] Hoàn thành với status AVAILABLE

### Sau khi test:
- [ ] Đơn hàng status = DELIVERED
- [ ] Drone status = AVAILABLE
- [ ] Log không có lỗi
- [ ] Có thể test lại từ đầu

---

## 🐛 XỬ LÝ LỖI

### Lỗi: "Drone already exists"
**Nguyên nhân**: Drone đã được đăng ký trước đó
**Giải pháp**: Tự động sử dụng drone hiện có (warning, không phải error)

### Lỗi: "No stores found"
**Nguyên nhân**: Database chưa có dữ liệu stores
**Giải pháp**: 
```sql
-- Thêm cửa hàng mẫu
INSERT INTO store (owner_user_id, name, description, phone_number, email, status, rating)
VALUES (1, 'Cơm Tấm Sài Gòn', 'Cơm tấm truyền thống', '0901234567', 'comtam@example.com', 'OPEN', 4.5);

-- Thêm địa chỉ cửa hàng
INSERT INTO store_address (store_id, latitude, longitude, full_address)
VALUES (1, 10.762622, 106.660172, '123 Nguyễn Văn Linh, Q7, TP.HCM');
```

### Lỗi: "No products found"
**Nguyên nhân**: Store chưa có sản phẩm
**Giải pháp**: Sử dụng test page khác để thêm sản phẩm:
```
http://localhost:8080/home/test-store-and-products.html
```

### Lỗi: CORS
**Nguyên nhân**: Frontend khác domain không được phép
**Giải pháp**: Đã có `@CrossOrigin(origins = "*")` trong controller

### Lỗi: Connection refused
**Nguyên nhân**: Server chưa khởi động hoặc port sai
**Giải pháp**: 
- Kiểm tra server đang chạy
- Kiểm tra port: http://localhost:8080

---

## 📈 KẾT QUẢ MONG ĐỢI

### Thời gian test:
- **Test tự động**: ~10-15 giây
- **Test thủ công**: ~2-3 phút

### Dữ liệu sau test:
- 1 drone registered (AVAILABLE)
- 1 order created (DELIVERED - simulated)
- GPS logs (20+ entries)
- Battery: 100% → 80%
- Flight path: A(10.762622, 106.660172) → B(10.773622, 106.670172)

---

## 🚀 NÂNG CAO

### Test với nhiều drone:
```javascript
// Thay đổi droneCode trong code
droneCode = 'DRONE002';
droneCode = 'DRONE003';
```

### Test với real API (khi có Order/Delivery controller):
```javascript
// Bước 5: Gọi real API
const response = await fetch(`${apiBaseUrl}/orders/checkout`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    cartId: cartId,
    deliveryAddressId: addressId,
    paymentMethod: 'CASH_ON_DELIVERY'
  })
});
```

### Test trên điện thoại:
1. Lấy IP máy tính: `ipconfig` (Windows) hoặc `ifconfig` (Mac/Linux)
2. Mở trên phone: `http://192.168.1.86:8080/home/test-complete-order-flow.html`
3. Chạy test như bình thường

---

## 📞 TÍCH HỢP VỚI POSTMAN

Có thể test từng API riêng lẻ bằng Postman:
```
File: Drone_Complete_APIs.postman_collection.json

Tests:
- Drones → Register Drone
- Stores → Get All Stores
- Products → Get Products by Store
- Cart → Add to Cart (khi có controller)
- Orders → Create Order (khi có controller)
- Delivery → Track Delivery (khi có controller)
```

---

## 🎓 TỔNG KẾT

Test page này giúp bạn:
- ✅ Test toàn bộ luồng end-to-end
- ✅ Visualize drone movement
- ✅ Debug từng bước
- ✅ Không cần frontend riêng
- ✅ Mô phỏng real-world scenario

**Lưu ý**: 
- Hiện tại Order & Delivery được simulated (mock)
- Khi có OrderController & DeliveryController, có thể update để gọi real API
- Cart operations hiện đang client-side, có thể tích hợp với CartController API

---

📝 **Document created**: 2025-11-03
🔄 **Last updated**: 2025-11-03
👨‍💻 **Project**: FoodFast - Complete Order Flow Test

