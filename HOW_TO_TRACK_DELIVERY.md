# 📍 Hướng Dẫn Theo Dõi Giao Hàng Drone

## 🎯 Tổng Quan

Hệ thống FoodFast hiện đã tích hợp **theo dõi drone tự động với bản đồ trực quan**. Khách hàng có thể xem drone bay từ cửa hàng đến địa chỉ giao hàng trong thời gian thực.

---

## 🚀 Cách Truy Cập Tính Năng Theo Dõi

### **Phương Pháp 1: Từ Trang Đơn Hàng** (Khuyến Nghị)

1. **Đăng nhập** vào tài khoản khách hàng
2. Truy cập **Trang Đơn Hàng** (Orders):
   - URL: `http://localhost:8080/home/orders.html`
   - Hoặc click vào menu "Đơn hàng của tôi"

3. Tìm đơn hàng có trạng thái:
   - ✅ `IN_DELIVERY` (Đang giao hàng) - **Tối ưu nhất**
   - ✅ `PAID` (Đã thanh toán) - Nếu drone đã được phân công

4. Click nút **"🚁 Theo dõi"** trên đơn hàng

5. Hệ thống sẽ tự động chuyển đến trang theo dõi với bản đồ

---

### **Phương Pháp 2: Truy Cập Trực Tiếp**

Nếu bạn biết `deliveryId`, có thể truy cập trực tiếp:

```
http://localhost:8080/home/delivery-tracking.html?deliveryId={id}
```

**Ví dụ:**
```
http://localhost:8080/home/delivery-tracking.html?deliveryId=1
```

---

## 📋 Quy Trình Kiểm Tra Đầy Đủ

### **Bước 1: Khởi Động Server**

```powershell
cd d:\HKI_4\CNPM\foodfast
.\start-server.bat
```

Đợi server khởi động hoàn tất (thường 30-60 giây)

---

### **Bước 2: Tạo Đơn Hàng (Khách Hàng)**

1. Đăng nhập với tài khoản khách hàng:
   - Username: `customer1` / Password: `password123`
   
2. Chọn sản phẩm và thêm vào giỏ hàng

3. Đặt hàng và thanh toán (VNPay hoặc COD)

4. Ghi nhớ **Order Code** hoặc **Order ID**

---

### **Bước 3: Chấp Nhận Đơn Hàng (Cửa Hàng)**

1. Đăng nhập với tài khoản cửa hàng:
   - Username: `store1` / Password: `password123`

2. Vào **Store Dashboard** → **Đơn hàng mới**

3. Click **"Chấp nhận"** đơn hàng

4. ✨ **Hệ thống tự động:**
   - Phân công drone khả dụng
   - Tạo delivery record
   - **Khởi động mô phỏng bay tự động**
   - Sau 1 phút → Drone khởi hành (status: `LAUNCHED`)

---

### **Bước 4: Theo Dõi Giao Hàng (Khách Hàng)**

1. Quay lại tài khoản khách hàng (customer1)

2. Vào **Trang Đơn Hàng**:
   ```
   http://localhost:8080/home/orders.html
   ```

3. Tìm đơn hàng vừa tạo (status: `IN_DELIVERY`)

4. Click nút **"🚁 Theo dõi"**

5. **Bạn sẽ thấy:**
   - 🗺️ Bản đồ Leaflet với 3 marker:
     - 🏪 **Store** (cửa hàng xuất phát) - marker xanh lá
     - 🚁 **Drone** (vị trí hiện tại) - marker xanh dương, di chuyển theo thời gian thực
     - 📍 **Customer** (điểm đến) - marker đỏ
   - 📊 Thanh tiến độ (0-100%)
   - ⏱️ Thời gian dự kiến đến (ETA)
   - 🔋 Thông tin drone (model, battery)
   - 📍 Đường bay (đường nét đứt giữa store và customer)
   - 🎯 Timeline với 5 giai đoạn

---

## 🎬 Timeline Mô Phỏng

Sau khi cửa hàng chấp nhận đơn hàng:

| Thời Gian | Sự Kiện | Trạng Thái | Mô Tả |
|-----------|---------|-----------|-------|
| **T+0s** | Chấp nhận đơn | `ASSIGNED` | Phân công drone, bắt đầu mô phỏng |
| **T+1min** | Khởi hành | `LAUNCHED` | Drone cất cánh, Order → `IN_DELIVERY` |
| **T+1-10min** | Bay | `LAUNCHED` | Cập nhật vị trí mỗi 5 giây (nội suy tuyến tính) |
| **T+8min** | Sắp đến | `ARRIVING` | Đã đi được 80% quãng đường |
| **T+10min** | Hoàn thành | `COMPLETED` | Giao hàng thành công, Drone → `AVAILABLE`, Order → `DELIVERED` |

**⚠️ Lưu ý:** Thời gian trên có thể tùy chỉnh trong `application.yaml`:
```yaml
app:
  delivery:
    simulation:
      prep-time-minutes: 1    # Thời gian chuẩn bị trước khi khởi hành
      update-interval-seconds: 5  # Tần suất cập nhật vị trí
```

---

## 🔄 Cập Nhật Thời Gian Thực

Trang theo dõi tự động **cập nhật mỗi 5 giây**:
- ✅ Vị trí drone di chuyển trên bản đồ
- ✅ Thanh tiến độ tăng dần
- ✅ Timeline thay đổi theo trạng thái
- ✅ ETA countdown

**Không cần làm gì** - chỉ cần ngồi xem drone bay! 🚁

---

## 🧪 Test Scenarios

### **Scenario 1: Happy Path (Giao Hàng Thành Công)**

1. Customer đặt hàng → Thanh toán
2. Store chấp nhận
3. Đợi 1 phút → Drone khởi hành (`LAUNCHED`)
4. Customer click "Theo dõi" → Thấy drone bay trên map
5. Đợi ~10 phút → Drone hoàn thành (`COMPLETED`)
6. Order status → `DELIVERED`

**Expected Results:**
- ✅ Drone di chuyển mượt mà từ store đến customer
- ✅ Progress bar: 0% → 100%
- ✅ Timeline hiển thị đầy đủ 5 giai đoạn
- ✅ Không có lỗi console
- ✅ API trả về 200 OK

---

### **Scenario 2: Tracking Before Launch**

1. Store vừa chấp nhận đơn (chưa đến 1 phút)
2. Customer click "Theo dõi" ngay lập tức
3. Trạng thái: `ASSIGNED`, chưa có actualDepartureTime

**Expected Results:**
- ✅ Map hiển thị store và customer markers
- ✅ Drone marker ở vị trí store (chưa di chuyển)
- ✅ Timeline chỉ hiển thị "✅ Đã phân công drone"
- ✅ Message: "Drone đang chuẩn bị khởi hành..."
- ✅ Progress: 0-30%

---

### **Scenario 3: Tracking When Arriving**

1. Đợi đến phút thứ 8-9
2. Status tự động chuyển sang `ARRIVING`
3. Customer refresh trang theo dõi

**Expected Results:**
- ✅ Alert màu cam nổi bật: "🚁 DRONE SẮP ĐẾN!"
- ✅ Timeline highlight giai đoạn ARRIVING
- ✅ Progress: 80-99%
- ✅ ETA: "Vài phút nữa"

---

### **Scenario 4: Tracking After Completion**

1. Đợi đủ 10 phút → Delivery hoàn thành
2. Customer vẫn ở trang theo dõi

**Expected Results:**
- ✅ Status: `COMPLETED`
- ✅ Drone marker đến vị trí customer
- ✅ Progress: 100%
- ✅ Timeline: Tất cả checkmarks màu xanh
- ✅ Message: "✅ Đã giao hàng thành công"

---

## 🐛 Troubleshooting

### **Vấn Đề 1: Không Thấy Nút "Theo Dõi"**

**Nguyên nhân:**
- Order chưa có status `IN_DELIVERY` hoặc `PAID`
- Hoặc store chưa chấp nhận đơn hàng

**Giải pháp:**
1. Kiểm tra order status trong database:
   ```sql
   SELECT id, order_code, status FROM orders WHERE id = {orderId};
   ```
2. Nếu status là `PENDING`, store cần chấp nhận đơn
3. Nếu status là `COMPLETED`, đơn đã giao xong

---

### **Vấn Đề 2: Click "Theo Dõi" Báo Lỗi "Chưa có thông tin giao hàng"**

**Nguyên nhân:**
- Delivery record chưa được tạo (store chưa chấp nhận)
- Hoặc API endpoint bị lỗi

**Giải pháp:**
1. Check console log trong browser (F12)
2. Kiểm tra database:
   ```sql
   SELECT * FROM deliveries WHERE order_id = {orderId};
   ```
3. Nếu không có record → Store cần chấp nhận đơn lại
4. Check server logs để xem lỗi API

---

### **Vấn Đề 3: Map Không Hiển Thị**

**Nguyên nhân:**
- Leaflet.js không load được
- Hoặc coordinates không hợp lệ

**Giải pháp:**
1. Check console errors (F12)
2. Verify Leaflet CDN:
   ```html
   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
   ```
3. Kiểm tra coordinates trong database:
   ```sql
   SELECT sa.latitude, sa.longitude 
   FROM store_addresses sa 
   JOIN stores s ON s.address_id = sa.id;
   ```

---

### **Vấn Đề 4: Drone Không Di Chuyển**

**Nguyên nhân:**
- Simulation service không chạy
- Hoặc actualDepartureTime chưa được set

**Giải pháp:**
1. Check server logs:
   ```
   🚁 Delivery simulation started for delivery {id}
   ✈️ Drone {id} launched for delivery {id}
   📍 Updated drone position: lat={}, lng={}
   ```
2. Verify config trong `application.yaml`:
   ```yaml
   app.delivery.simulation.enabled: true
   ```
3. Restart server nếu cần

---

### **Vấn Đề 5: Progress Không Cập Nhật**

**Nguyên nhân:**
- Polling bị stop
- Hoặc API trả về lỗi

**Giải pháp:**
1. Check Network tab (F12) → Mỗi 5 giây phải có request đến:
   ```
   GET /home/api/v1/deliveries/{id}/tracking
   ```
2. Xem response có lỗi không
3. Check console log:
   ```javascript
   console.log('Tracking update:', data);
   ```

---

## 📊 API Endpoint

Tracking page gọi endpoint này mỗi 5 giây:

```http
GET /home/api/v1/deliveries/{deliveryId}/tracking
```

**Response Example:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Delivery tracking info",
  "result": {
    "deliveryId": 1,
    "orderId": 1,
    "orderCode": "ORD-20240101-ABC",
    "status": "LAUNCHED",
    "dronePosition": {
      "latitude": 10.7850,
      "longitude": 106.6950
    },
    "storePosition": {
      "latitude": 10.7800,
      "longitude": 106.7000
    },
    "customerPosition": {
      "latitude": 10.7900,
      "longitude": 106.6900
    },
    "progress": 45.5,
    "distanceKm": 2.5,
    "estimatedArrival": "2024-01-01T10:30:00",
    "actualDeparture": "2024-01-01T10:20:00",
    "droneId": 1,
    "droneModel": "DJI Phantom",
    "batteryPercent": 85.0
  }
}
```

---

## ⚙️ Cấu Hình

File: `src/main/resources/application.yaml`

```yaml
app:
  delivery:
    simulation:
      enabled: true                    # Bật/tắt mô phỏng tự động
      prep-time-minutes: 1             # Thời gian chuẩn bị trước khi khởi hành
      update-interval-seconds: 5       # Tần suất cập nhật vị trí drone
```

**Tùy Chỉnh:**
- Muốn drone khởi hành nhanh hơn → Giảm `prep-time-minutes`
- Muốn cập nhật mượt hơn → Giảm `update-interval-seconds` (cẩn thận với performance)
- Muốn tắt mô phỏng (test thủ công) → Set `enabled: false`

---

## 📱 Tương Lai - Tính Năng Mở Rộng

- [ ] **WebSocket**: Thay thế polling bằng real-time push
- [ ] **Mobile App**: Tracking trên iOS/Android
- [ ] **QR Code**: Scan để track không cần login
- [ ] **Notification**: Push notification khi drone sắp đến
- [ ] **Multi-Drone**: Xem nhiều drone cùng lúc (admin view)
- [ ] **3D View**: Hiển thị độ cao drone
- [ ] **Weather Integration**: Tính toán thời gian bay dựa trên thời tiết
- [ ] **Battery Monitoring**: Alert khi pin yếu, tự động quay về sạc

---

## 📝 Tóm Tắt

**Để xem quá trình giao hàng:**
1. ✅ Store chấp nhận đơn
2. ✅ Vào trang Orders (`/home/orders.html`)
3. ✅ Tìm đơn có status `IN_DELIVERY`
4. ✅ Click nút **"🚁 Theo dõi"**
5. ✅ Xem drone bay trên map!

**Demo nhanh:**
```powershell
# Terminal 1: Start server
.\start-server.bat

# Browser 1: Customer đặt hàng + thanh toán
# Browser 2: Store chấp nhận đơn
# Browser 1: Click "Theo dõi" → Xem drone bay
```

---

## 🎯 Kết Luận

Hệ thống theo dõi drone của FoodFast giờ đây đã **hoàn toàn tự động** với:
- ✅ Mô phỏng bay thực tế (10 phút)
- ✅ Bản đồ trực quan với Leaflet
- ✅ Cập nhật real-time mỗi 5 giây
- ✅ Timeline rõ ràng 5 giai đoạn
- ✅ Tích hợp hoàn hảo với flow đặt hàng hiện có

**Không cần thao tác thủ công nữa!** 🎉

---

**Tài Liệu Liên Quan:**
- 📄 `DRONE_TRACKING_GUIDE.md` - Chi tiết kỹ thuật implementation
- 📄 `COMPLETE_BUSINESS_FLOW_ANALYSIS.md` - Toàn bộ business flow
- 📄 `API_ENDPOINTS_COMPLETE.md` - Danh sách API endpoints

**Hỗ Trợ:**
- GitHub Issues: [Link to repository]
- Email: support@foodfast.vn
