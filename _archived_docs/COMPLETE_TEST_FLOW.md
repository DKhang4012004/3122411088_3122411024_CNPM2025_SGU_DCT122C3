# Hướng dẫn Test Order Flow - Từ đặt hàng đến nhận hàng

## 🎯 Mục tiêu
Test toàn bộ flow: Khách đặt hàng → Thanh toán → Giao hàng → Nhận hàng

## 📋 Chuẩn bị

### 1. Start Server
```bash
cd D:\HKI_4\CNPM\foodfast
.\mvnw.cmd spring-boot:run
```

Đợi đến khi thấy:
```
Started FoodfastApplication in X seconds
```

### 2. Start Ngrok (nếu test VNPay)
```bash
cd D:\HKI_4\CNPM\foodfast
start-ngrok.bat
```

Copy URL ngrok (vd: https://xxxx.ngrok.io)

### 3. Mở trình duyệt
- URL: http://localhost:8080/home
- Mở Developer Tools (F12) để xem Console

---

## 🛒 Flow Test Chi Tiết

### **Bước 1: Đăng nhập**

1. Click "Đăng nhập"
2. Nhập:
   - Username: `danh11` (hoặc tạo tài khoản mới)
   - Password: `123456`
3. Click "Đăng nhập"
4. ✅ Kiểm tra: Thấy tên user ở góc phải

**Console check:**
```javascript
// Kiểm tra user đã login chưa
console.log(JSON.parse(localStorage.getItem('foodfast_user')));
// Phải thấy: {id: X, username: "...", ...}
```

---

### **Bước 2: Chọn cửa hàng**

1. Trang chủ hiển thị danh sách cửa hàng
2. Click vào 1 cửa hàng (vd: "Phở Hà Nội")
3. ✅ Kiểm tra: Hiển thị danh sách món ăn

**Console check:**
```
Loading store: X
Products loaded: Y items
```

---

### **Bước 3: Thêm món vào giỏ hàng**

1. Chọn 1 hoặc nhiều món ăn
2. Click "Thêm vào giỏ"
3. ✅ Kiểm tra: 
   - Thông báo "Đã thêm vào giỏ hàng"
   - Badge giỏ hàng tăng số lượng (góc phải icon giỏ hàng)

**Console check:**
```
Adding to cart: {productId: X, quantity: 1}
Cart updated: 3 items
```

---

### **Bước 4: Xem giỏ hàng**

1. Click icon giỏ hàng (góc phải)
2. ✅ Kiểm tra:
   - Hiển thị danh sách món đã chọn
   - Số lượng đúng
   - Tổng tiền đúng

**Console check:**
```
Loading cart...
Cart data: {cartItems: [...], totalAmount: X}
```

**❗ Nếu giỏ hàng trống mặc dù đã thêm:**
- Kiểm tra user đã login chưa
- Check API: `/api/cart` trong Network tab (F12 → Network)

---

### **Bước 5: Thanh toán**

1. Trong trang giỏ hàng, click "Thanh toán"
2. Hệ thống sẽ:
   - Tạo đơn hàng (Orders)
   - Redirect đến VNPay payment gateway

**Console check:**
```
Creating orders from cart...
Payment init response: {paymentUrl: "...", orderId: X}
Redirecting to VNPay...
```

**API calls:**
1. `POST /api/v1/orders` - Tạo đơn hàng từ giỏ
2. `POST /api/v1/payments/init` - Khởi tạo thanh toán

**❗ Nếu lỗi "Failed to create orders":**
- Kiểm tra cart có items không
- Check console logs
- Xem Network tab để xem response

---

### **Bước 6: Thanh toán VNPay (Sandbox)**

1. Trang VNPay hiển thị
2. Chọn ngân hàng: **NCB**
3. Nhập thông tin test:
   - Số thẻ: `9704198526191432198`
   - Tên chủ thẻ: `NGUYEN VAN A`
   - Ngày phát hành: `07/15`
   - Mật khẩu: `123456`
4. Click "Thanh toán"

**✅ Kiểm tra:**
- Redirect về trang success
- Thông báo "Thanh toán thành công"

**❗ Nếu lỗi redirect:**
- Kiểm tra ngrok đang chạy
- Check returnUrl trong payment init

---

### **Bước 7: Xem đơn hàng**

1. Click "Đơn hàng của tôi"
2. ✅ Kiểm tra:
   - Hiển thị đơn hàng vừa tạo
   - Trạng thái: "Đã thanh toán" hoặc "Chờ xác nhận"
   - Thông tin đúng: món ăn, số lượng, tổng tiền

**Console check:**
```
=== LOADING ORDERS ===
User from localStorage: {id: X, ...}
✅ User ID found: X
📡 Calling API: .../api/v1/orders/user/X
📦 Orders response: {result: [order1, order2, ...]}
```

**❗ Nếu bị logout khi vào Orders:**
- **Chạy lệnh fix trong Console** (xem FIX_SUMMARY.md)
- Hoặc đăng xuất và đăng nhập lại

---

### **Bước 8: Cửa hàng xác nhận đơn (Admin)**

**Option 1: Dùng Postman**

```http
POST http://localhost:8080/home/api/v1/orders/{orderId}/accept
Authorization: Bearer {token}
Content-Type: application/json

{
    "estimatedPrepTime": 15
}
```

**Option 2: Dùng Admin Panel (nếu có)**
1. Login as store owner
2. Vào "Quản lý đơn hàng"
3. Click "Chấp nhận đơn" trên order mới

**✅ Kiểm tra:**
- Order status chuyển sang: `CONFIRMED`

---

### **Bước 9: Chuẩn bị món và giao cho drone**

**Cửa hàng cập nhật status:**

```http
PUT http://localhost:8080/home/api/v1/orders/{orderId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
    "status": "PREPARING"
}
```

Sau đó:

```http
PUT http://localhost:8080/home/api/v1/orders/{orderId}/status
Content-Type: application/json

{
    "status": "READY"
}
```

**✅ Kiểm tra:**
- Order status: `READY`
- Sẵn sàng để giao

---

### **Bước 10: Gán drone và bắt đầu giao hàng**

```http
POST http://localhost:8080/home/api/v1/deliveries
Authorization: Bearer {token}
Content-Type: application/json

{
    "orderId": {orderId},
    "droneCode": "DRONE001"
}
```

**Response:**
```json
{
    "code": 200,
    "message": "Delivery created successfully",
    "result": {
        "id": X,
        "orderId": Y,
        "droneCode": "DRONE001",
        "status": "ASSIGNED",
        "estimatedTime": 20
    }
}
```

**✅ Kiểm tra:**
- Order status: `PICKED_UP` → `IN_DELIVERY`
- Delivery được tạo

---

### **Bước 11: Theo dõi giao hàng**

**Frontend:**
1. Vào trang "Đơn hàng của tôi"
2. Click "Theo dõi" trên đơn đang giao
3. Xem vị trí drone trên bản đồ (nếu có)

**API check:**
```http
GET http://localhost:8080/home/api/v1/deliveries/order/{orderId}
Authorization: Bearer {token}
```

**Response:**
```json
{
    "code": 200,
    "result": {
        "status": "IN_TRANSIT",
        "currentLocation": {
            "latitude": 10.762622,
            "longitude": 106.660172
        },
        "estimatedArrival": "2025-11-04T15:30:00"
    }
}
```

---

### **Bước 12: Hoàn thành giao hàng**

```http
PUT http://localhost:8080/home/api/v1/deliveries/{deliveryId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
    "status": "DELIVERED",
    "actualDeliveryTime": "2025-11-04T15:25:00",
    "deliveryNote": "Đã giao hàng thành công"
}
```

**✅ Kiểm tra:**
- Order status: `DELIVERED`
- Delivery status: `DELIVERED`
- Customer nhận được thông báo

---

## 🧪 Test với Postman Collection

Import file: `Complete_Order_Flow_Test.postman_collection.json`

**Test scenarios:**
1. ✅ Full Happy Path (tất cả thành công)
2. ✅ Payment Failed (thanh toán thất bại)
3. ✅ Order Cancelled (hủy đơn)
4. ✅ Drone Unavailable (không có drone)

---

## 🐛 Troubleshooting

### Lỗi: "User missing ID" khi vào Orders
**Fix:** Chạy lệnh trong Console:
```javascript
(function() {
    const user = JSON.parse(localStorage.getItem('foodfast_user'));
    if (!user.id && user.userId) {
        user.id = user.userId;
        localStorage.setItem('foodfast_user', JSON.stringify(user));
        alert('Fixed! Reload page (F5)');
    }
})();
```

### Lỗi: Cart trống mặc dù đã thêm món
**Check:**
1. User đã login chưa?
2. Network tab: check response của `/api/cart/add`
3. Console có lỗi gì không?

### Lỗi: Payment redirect không về
**Check:**
1. Ngrok có đang chạy không?
2. ReturnUrl trong payment init đúng chưa?
3. VNPay sandbox có hoạt động không?

### Lỗi: Không load được products
**Check:**
1. API `/products/store/{storeId}` có trả về data không?
2. StoreId có đúng không?
3. Database có products không?

---

## 📊 Expected Flow Timeline

```
[0s]   User login
[5s]   Browse stores → Select store
[10s]  Add items to cart
[15s]  View cart → Checkout
[20s]  Create orders → Init payment
[25s]  VNPay payment → Return
[30s]  View orders (status: PAID)
[35s]  Store accepts order
[40s]  Store prepares food
[45s]  Assign drone → Start delivery
[60s]  Delivery in progress
[80s]  Delivered → Order complete
```

---

## ✅ Success Criteria

1. ✅ User có thể đăng nhập
2. ✅ Thêm món vào giỏ thành công
3. ✅ Thanh toán VNPay thành công
4. ✅ Orders hiển thị đúng
5. ✅ Store có thể accept orders
6. ✅ Delivery được tạo và track
7. ✅ Order status cập nhật đúng theo flow

---

## 📝 Notes

- **Database:** Đảm bảo có test data (stores, products, drones)
- **VNPay:** Dùng sandbox environment
- **Ngrok:** Chỉ cần khi test payment returnUrl
- **Auth:** Token JWT hết hạn sau 1h (configurable)

---

## 🆘 Need Help?

1. Check console logs (F12)
2. Check Network tab (F12 → Network)
3. Check backend logs (terminal running mvnw)
4. Check database (DBeaver/MySQL Workbench)

**Common logs location:**
- Frontend: Browser Console (F12)
- Backend: Terminal window
- Database: `demo_database_setup.sql` schema

