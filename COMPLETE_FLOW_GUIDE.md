# 🎯 Hướng dẫn Test Flow Đầy đủ - Từ Đặt hàng đến Giao hàng

## 📋 Tổng quan

Flow hoàn chỉnh: **Khách đặt hàng → Cửa hàng xác nhận → Drone giao hàng**

### Các trang đã tạo:
1. **index.html** - Trang chủ (khách hàng đặt hàng)
2. **cart.html** - Giỏ hàng & thanh toán
3. **orders.html** - Xem đơn hàng (khách hàng)
4. **store-management.html** - Quản lý đơn hàng (cửa hàng) ⭐ MỚI
5. **drone-management.html** - Quản lý drone & giao hàng ⭐ MỚI

---

## 🚀 Bước 1: Chuẩn bị

### Start Server & Ngrok
```bash
# Terminal 1 - Server
cd D:\HKI_4\CNPM\foodfast
.\mvnw.cmd spring-boot:run

# Terminal 2 - Ngrok (nếu test VNPay)
start-ngrok.bat
```

### Tạo test data (nếu cần)
```bash
# Insert stores, products, drones
insert-test-data.bat
```

---

## 👤 Bước 2: Khách hàng đặt hàng

### 2.1. Đăng nhập
```
URL: http://localhost:8080/home
Login: danh11 / 123456
```

### 2.2. Chọn món ăn
1. Click vào cửa hàng
2. Chọn món → "Thêm vào giỏ"
3. Badge giỏ hàng tăng số

### 2.3. Thanh toán
1. Click icon giỏ hàng
2. Kiểm tra món đã thêm
3. Click "Thanh toán"
4. VNPay sandbox:
   - Bank: **NCB**
   - Card: **9704198526191432198**
   - Name: **NGUYEN VAN A**
   - Date: **07/15**
   - OTP: **123456**

### 2.4. Xem đơn hàng
1. Click "Đơn hàng của tôi"
2. Thấy đơn vừa tạo
3. Trạng thái: **"Đã thanh toán"** hoặc **"Chờ xác nhận"**

✅ **Checkpoint:** Đơn hàng đã được tạo thành công

---

## 🏪 Bước 3: Cửa hàng xử lý đơn

### 3.1. Mở trang quản lý cửa hàng
```
URL: http://localhost:8080/home/store-management.html
```

**Tính năng:**
- ✅ Dashboard thống kê đơn hàng
- ✅ Tab "Chờ xác nhận" hiển thị đơn mới
- ✅ Chi tiết đơn: món ăn, số lượng, tổng tiền
- ✅ Auto refresh mỗi 30s

### 3.2. Xác nhận đơn hàng
1. Xem đơn trong tab **"Chờ xác nhận"**
2. Click **"Chấp nhận"**
3. ✅ Trạng thái chuyển sang **"Đã xác nhận"**

### 3.3. Chuẩn bị món ăn
1. Đơn chuyển sang tab **"Đã xác nhận"**
2. Click **"Bắt đầu chuẩn bị"**
3. ✅ Trạng thái chuyển sang **"Đang chuẩn bị"**

### 3.4. Hoàn thành chuẩn bị
1. Đơn chuyển sang tab **"Đang chuẩn bị"**
2. Click **"Sẵn sàng"**
3. ✅ Trạng thái chuyển sang **"Sẵn sàng"**

✅ **Checkpoint:** Đơn hàng sẵn sàng để giao

---

## 🚁 Bước 4: Giao hàng bằng Drone

### 4.1. Gán drone cho đơn hàng
**Từ trang Store Management:**
1. Trong tab **"Sẵn sàng"**
2. Click **"Giao cho drone"**
3. → Redirect sang **drone-management.html**

**Hoặc mở trực tiếp:**
```
URL: http://localhost:8080/home/drone-management.html?orderId=1
```

### 4.2. Chọn drone
**Bên trái: Danh sách Drone**
- ✅ Hiển thị tất cả drone
- ✅ Trạng thái: Sẵn sàng / Đang bận / Bảo trì
- ✅ Thông tin: Pin, tải trọng, vị trí

**Click vào drone "Sẵn sàng"**

### 4.3. Tạo giao hàng
**Bên phải: Form tạo giao hàng**
1. Xem thông tin đơn hàng
2. Drone đã chọn tự động điền
3. Nhập thời gian giao dự kiến (mặc định: 20 phút)
4. Thêm ghi chú (optional)
5. Click **"Tạo giao hàng"**

✅ **Kết quả:**
- Order status → **"IN_DELIVERY"**
- Drone status → **"BUSY"**
- Delivery được tạo

### 4.4. Theo dõi giao hàng
**Timeline hiển thị:**
```
✅ Đã gán drone
⏳ Đang đến lấy hàng
⏳ Đã lấy hàng
⏳ Đang giao hàng
⏳ Đã giao thành công
```

**Thông tin giao hàng:**
- Mã giao hàng
- Drone code
- Thời gian dự kiến
- Trạng thái hiện tại

**Click "Làm mới trạng thái"** để update

---

## 🔄 Bước 5: Cập nhật trạng thái Delivery (Backend)

### Option 1: Dùng Postman

#### 5.1. Update Delivery Status
```http
PUT http://localhost:8080/home/api/v1/deliveries/{deliveryId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
    "status": "PICKING_UP"
}
```

**Các status có thể update:**
- `PICKING_UP` - Đang đến lấy hàng
- `PICKED_UP` - Đã lấy hàng
- `IN_TRANSIT` - Đang giao hàng
- `DELIVERED` - Đã giao thành công

#### 5.2. Hoàn thành giao hàng
```http
PUT http://localhost:8080/home/api/v1/deliveries/{deliveryId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
    "status": "DELIVERED",
    "actualDeliveryTime": "2025-11-04T15:30:00",
    "deliveryNote": "Giao hàng thành công"
}
```

### Option 2: Tự động (nếu có webhook/scheduler)
- Backend tự động cập nhật theo thời gian
- Simulate drone movement
- Update location realtime

---

## 📊 Flow Summary

```
[Khách hàng]
  Login → Chọn món → Giỏ hàng → Thanh toán VNPay
    ↓
  Đơn hàng tạo thành công (Status: PAID)
    ↓
[Cửa hàng] - store-management.html
  Xem đơn mới → Chấp nhận → Chuẩn bị → Sẵn sàng
    ↓
[Drone] - drone-management.html
  Chọn drone → Tạo giao hàng → Theo dõi
    ↓
[Backend/Postman]
  Update: PICKING_UP → PICKED_UP → IN_TRANSIT → DELIVERED
    ↓
[Khách hàng]
  Vào "Đơn hàng" → Thấy status "Đã giao" ✅
```

---

## 🎯 Test Scenarios

### Scenario 1: Happy Path (Tất cả thành công)
1. ✅ Đặt hàng → Thanh toán thành công
2. ✅ Cửa hàng chấp nhận → Chuẩn bị → Sẵn sàng
3. ✅ Gán drone → Giao hàng → Hoàn thành

### Scenario 2: Cửa hàng từ chối
1. Đặt hàng → Thanh toán thành công
2. Cửa hàng click "Từ chối"
3. ✅ Order status → CANCELLED

### Scenario 3: Không có drone khả dụng
1. Tất cả drone đều BUSY hoặc MAINTENANCE
2. Không thể tạo giao hàng
3. ✅ Hiển thị thông báo "Chọn drone khả dụng"

### Scenario 4: Giao hàng thất bại
1. Update delivery status → FAILED
2. Order status → ?
3. Có thể reassign drone khác

---

## 📸 Screenshots & Demo

### Store Management Page
```
┌─────────────────────────────────────┐
│  🏪 Cửa hàng ABC                    │
│  📍 123 Đường XYZ                   │
├─────────────────────────────────────┤
│  Stats: 5 Pending | 3 Preparing    │
├─────────────────────────────────────┤
│  [Chờ xác nhận] [Đã xác nhận] ...  │
├─────────────────────────────────────┤
│  Order #123                         │
│  👤 Khách A                          │
│  📦 Phở bò x2, Nem x1               │
│  💰 150,000đ                         │
│  [✓ Chấp nhận] [✗ Từ chối]         │
└─────────────────────────────────────┘
```

### Drone Management Page
```
┌─────────────────────────────────────┐
│  Left: Drone List                   │
│  ┌─────────────────┐                │
│  │ 🚁 DRONE001     │ ← Click        │
│  │ Status: Sẵn sàng│                │
│  │ 🔋 95% 📦 5kg   │                │
│  └─────────────────┘                │
├─────────────────────────────────────┤
│  Right: Delivery Form               │
│  Order #123                         │
│  Drone: DRONE001                    │
│  Time: [20] minutes                 │
│  Note: [____________]               │
│  [📤 Tạo giao hàng]                 │
└─────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Lỗi: Không load được đơn hàng trong Store Management
**Check:**
1. Đã login chưa?
2. Store có đơn hàng không?
3. Console có lỗi API không?

**Fix:**
```javascript
// F12 Console
console.log(localStorage.getItem('foodfast_token'));
// Phải có token
```

### Lỗi: Không tạo được delivery
**Check:**
1. Order status phải là READY
2. Drone phải AVAILABLE
3. Backend có API `/api/v1/deliveries` không?

**Fix:**
```javascript
// Check API endpoint
console.log(API_CONFIG.ENDPOINTS.DELIVERIES);
```

### Lỗi: Drone list trống
**Check:**
1. Database có drones không?
2. API `/drones` có trả về data không?

**Fix:**
```sql
-- Check database
SELECT * FROM drones;
```

---

## 🎓 API Reference

### Store Orders
```http
GET /api/v1/orders/store/{storeId}
Authorization: Bearer {token}
```

### Accept Order
```http
POST /api/v1/orders/{orderId}/accept
Authorization: Bearer {token}
Content-Type: application/json

{
    "estimatedPrepTime": 15
}
```

### Update Order Status
```http
PUT /api/v1/orders/{orderId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
    "status": "PREPARING"
}
```

### Create Delivery
```http
POST /api/v1/deliveries
Authorization: Bearer {token}
Content-Type: application/json

{
    "orderId": 1,
    "droneCode": "DRONE001",
    "estimatedDeliveryTime": 20,
    "note": "Handle with care"
}
```

### Get Delivery by Order
```http
GET /api/v1/deliveries/order/{orderId}
Authorization: Bearer {token}
```

### Update Delivery Status
```http
PUT /api/v1/deliveries/{deliveryId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
    "status": "DELIVERED",
    "actualDeliveryTime": "2025-11-04T15:30:00"
}
```

### List Drones
```http
GET /drones
```

---

## ✅ Checklist Test Hoàn chỉnh

### Khách hàng
- [ ] Đăng nhập thành công
- [ ] Thêm món vào giỏ
- [ ] Thanh toán VNPay thành công
- [ ] Xem đơn hàng trong orders.html
- [ ] Không bị logout

### Cửa hàng
- [ ] Mở store-management.html
- [ ] Thấy đơn trong "Chờ xác nhận"
- [ ] Chấp nhận đơn thành công
- [ ] Update status: CONFIRMED → PREPARING → READY
- [ ] Stats cập nhật đúng

### Drone
- [ ] Mở drone-management.html
- [ ] Load order info từ URL params
- [ ] Hiển thị danh sách drone
- [ ] Chọn drone khả dụng
- [ ] Tạo delivery thành công
- [ ] Timeline hiển thị đúng

### Backend
- [ ] Update delivery status qua API
- [ ] Order status tự động sync
- [ ] Drone status update khi gán

---

## 🎉 Success Criteria

1. ✅ Flow từ đặt hàng → giao hàng hoàn chỉnh
2. ✅ UI responsive, dễ sử dụng
3. ✅ Real-time update (auto refresh)
4. ✅ Error handling tốt
5. ✅ Console logs chi tiết để debug

---

**Created:** 2025-11-04  
**Status:** ✅ READY TO TEST  
**Files:**
- `store-management.html`
- `store-management.js`
- `drone-management.html`
- `drone-management.js`
- `config.js` (updated)

**Next:** Test toàn bộ flow theo hướng dẫn trên! 🚀

