# 🧪 Hướng Dẫn Test Luồng Đầy Đủ - Full Flow Testing Guide

## 📋 Tổng Quan Luồng
```
KHÁCH HÀNG ĐẶT HÀNG → THANH TOÁN → DRONE GIAO HÀNG → NHẬN HÀNG
```

---

## 🚀 Bước 1: Khởi Động Hệ Thống

### 1.1. Khởi động Database (MySQL)
```bash
# Đảm bảo MySQL đang chạy
# Port: 3306
# Database: foodfast_db
```

### 1.2. Khởi động Backend Server
```bash
cd D:\HKI_4\CNPM\foodfast
start-server.bat
```

**Chờ đến khi thấy:**
```
Started FoodfastApplication in X.XXX seconds
```

### 1.3. Kiểm tra API Endpoint
```
Backend URL: http://localhost:8080/home
Frontend URL: http://localhost:8080/home/
```

---

## 👤 Bước 2: Đăng Ký / Đăng Nhập

### 2.1. Mở trình duyệt
```
URL: http://localhost:8080/home/
```

### 2.2. Đăng ký tài khoản mới
1. Click **"Đăng ký"**
2. Điền thông tin:
   - Username: `testuser`
   - Password: `123456`
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Phone: `0123456789`
3. Click **"Đăng ký"**

### 2.3. Đăng nhập
1. Username: `testuser`
2. Password: `123456`
3. Click **"Đăng nhập"**

**✅ Kiểm tra:** Sau khi đăng nhập, trang chuyển sang stores.html

---

## 🏪 Bước 3: Chọn Sản Phẩm và Thêm Vào Giỏ Hàng

### 3.1. Xem danh sách cửa hàng
```
URL: http://localhost:8080/home/stores.html
```

- Hiển thị danh sách các cửa hàng
- Click **"Xem menu"** một cửa hàng

### 3.2. Xem sản phẩm
- Danh sách sản phẩm của cửa hàng hiển thị
- Click vào một sản phẩm để xem chi tiết

### 3.3. Thêm vào giỏ hàng
1. Chọn số lượng (+ / -)
2. Click **"Thêm vào giỏ hàng"**
3. **✅ Kiểm tra:** Thông báo "Đã thêm vào giỏ hàng"
4. **✅ Kiểm tra:** Icon giỏ hàng cập nhật số lượng

### 3.4. Thêm nhiều sản phẩm
- Lặp lại bước 3.3 với 2-3 sản phẩm khác

---

## 🛒 Bước 4: Xem Giỏ Hàng

### 4.1. Mở giỏ hàng
```
URL: http://localhost:8080/home/cart.html
hoặc click vào icon giỏ hàng
```

### 4.2. Kiểm tra giỏ hàng
**✅ Kiểm tra:**
- [ ] Hiển thị đúng sản phẩm đã thêm
- [ ] Số lượng chính xác
- [ ] Giá đúng
- [ ] Tổng tiền tính đúng

### 4.3. Chỉnh sửa giỏ hàng (tùy chọn)
- Thay đổi số lượng: Click +/-
- Xóa sản phẩm: Click icon thùng rác

---

## 💳 Bước 5: Thanh Toán

### 5.1. Checkout
1. Click **"Thanh toán"**
2. Xác nhận: Click **"OK"** trong popup

### 5.2. Chờ tạo đơn hàng
**✅ Kiểm tra:** Thông báo "Tạo đơn hàng thành công!"

### 5.3. VNPay Payment (Redirect)
- Hệ thống chuyển đến trang thanh toán VNPay
- **Chú ý:** Đây là sandbox, có thể bỏ qua thanh toán thực

### 5.4. Quay lại trang Orders
```
URL: http://localhost:8080/home/orders.html
```

---

## 📦 Bước 6: Xem Đơn Hàng

### 6.1. Kiểm tra danh sách đơn hàng
```
URL: http://localhost:8080/home/orders.html
```

**✅ Kiểm tra:**
- [ ] Hiển thị đơn hàng vừa tạo
- [ ] Mã đơn hàng (ORDER-XXXXXX)
- [ ] Tên cửa hàng
- [ ] Danh sách sản phẩm
- [ ] Tổng tiền
- [ ] Trạng thái đơn hàng

### 6.2. Xem chi tiết đơn hàng
1. Click **"Chi tiết"**
2. Xem thông tin đầy đủ của đơn hàng

---

## 🚁 Bước 7: Theo Dõi Giao Hàng Bằng Drone

### 7.1. Điều kiện để theo dõi
Đơn hàng phải có trạng thái:
- `PAID` (Đã thanh toán)
- `IN_DELIVERY` (Đang giao hàng)

### 7.2. Xem tracking
1. Click **"Theo dõi"** trên đơn hàng
2. Hiển thị modal với thông tin:
   - Mã drone
   - Trạng thái giao hàng
   - Vị trí hiện tại
   - Thời gian dự kiến

### 7.3. Cập nhật trạng thái giao hàng (Admin)
**Sử dụng Postman hoặc API:**

```http
PUT http://localhost:8080/home/api/v1/deliveries/{deliveryId}/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "PICKED_UP"
}
```

**Các trạng thái:**
- `PENDING` → `ASSIGNED` → `PICKED_UP` → `IN_TRANSIT` → `DELIVERED`

---

## 🎯 Bước 8: Hoàn Thành Đơn Hàng

### 8.1. Cập nhật trạng thái cuối cùng
```http
PUT http://localhost:8080/home/api/v1/deliveries/{deliveryId}/status
{
  "status": "DELIVERED"
}
```

### 8.2. Kiểm tra đơn hàng
1. Refresh trang orders
2. **✅ Kiểm tra:** Trạng thái = "Đã giao hàng"

---

## 📱 Test Bằng Postman

### Setup
1. Import collection: `Complete_Order_Flow_Test.postman_collection.json`
2. Set environment variables:
   ```
   base_url: http://localhost:8080/home
   token: {your_jwt_token}
   userId: {your_user_id}
   ```

### Test Flow trong Postman

#### 1. Authentication
```
POST /auth/signup
POST /auth/login
```

#### 2. Browse & Order
```
GET /api/stores                    # Xem cửa hàng
GET /products/store/{storeId}      # Xem sản phẩm
POST /api/cart/add                 # Thêm vào giỏ
GET /api/cart                      # Xem giỏ hàng
```

#### 3. Checkout
```
POST /api/v1/orders                # Tạo đơn hàng
POST /api/v1/payments/init         # Thanh toán
```

#### 4. Track Order
```
GET /api/v1/orders/user/{userId}          # Xem đơn hàng
GET /api/v1/orders/{orderId}              # Chi tiết đơn
GET /api/v1/deliveries/order/{orderId}    # Theo dõi giao hàng
```

#### 5. Delivery Management
```
PUT /api/v1/deliveries/{deliveryId}/status     # Cập nhật trạng thái
PUT /api/v1/deliveries/{deliveryId}/location   # Cập nhật vị trí
```

---

## 🐛 Các Vấn Đề Thường Gặp

### Vấn đề 1: Không thấy sản phẩm trong giỏ hàng
**Nguyên nhân:** Frontend đang tìm field `items` thay vì `cartItems`
**Giải pháp:** ✅ Đã fix trong cart.js

### Vấn đề 2: Không xem được đơn hàng
**Nguyên nhân:** Frontend dùng `order.orderId` thay vì `order.id`
**Giải pháp:** ✅ Đã fix trong orders.js

### Vấn đề 3: 404 Not Found
**Nguyên nhân:** Context path = `/home`
**Giải pháp:** 
- Đảm bảo URL bắt đầu bằng `/home`
- Frontend: `http://localhost:8080/home/`
- API: `http://localhost:8080/home/api/...`

### Vấn đề 4: Unauthorized
**Nguyên nhân:** Token hết hạn hoặc không có token
**Giải pháp:**
- Đăng nhập lại
- Kiểm tra localStorage có `authToken`

### Vấn đề 5: CSS không load
**Nguyên nhân:** Đường dẫn static resources sai
**Giải pháp:** 
- Kiểm tra WebMvcConfig
- CSS phải trong `src/main/resources/static/css/`

---

## 📊 Checklist Hoàn Chỉnh

### Frontend
- [x] Đăng ký tài khoản
- [x] Đăng nhập
- [x] Xem danh sách cửa hàng
- [x] Xem sản phẩm
- [x] Thêm vào giỏ hàng
- [x] Xem giỏ hàng (hiển thị đúng)
- [x] Thanh toán (checkout)
- [x] Xem đơn hàng (hiển thị đúng)
- [x] Theo dõi giao hàng

### Backend
- [x] API Authentication
- [x] API Stores & Products
- [x] API Cart (add, update, remove)
- [x] API Orders (create, view)
- [x] API Payment (VNPay integration)
- [x] API Delivery tracking
- [x] API Drone management

---

## 🎓 Kết Luận

Sau khi hoàn thành tất cả các bước trên, bạn đã test thành công toàn bộ luồng:

```
✅ Khách đăng ký/đăng nhập
✅ Xem cửa hàng và sản phẩm
✅ Thêm vào giỏ hàng
✅ Xem giỏ hàng (đã fix lỗi cartItems)
✅ Thanh toán
✅ Xem đơn hàng (đã fix lỗi order.id)
✅ Theo dõi giao hàng bằng drone
✅ Nhận hàng
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Console log trong browser (F12)
2. Backend log trong terminal
3. Database có dữ liệu đúng
4. Postman collection để test API trực tiếp

---

**Happy Testing! 🚀**

