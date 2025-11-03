# Hướng Dẫn Luồng Giao Hàng Drone - FoodFast

## 📋 Tổng Quan Luồng Giao Hàng

Luồng giao hàng của FoodFast bao gồm các bước sau:

```
1. Khách đặt hàng → 2. Thanh toán → 3. Tạo Delivery → 4. Gán Drone → 
5. Drone bay đến quán → 6. Lấy hàng → 7. Bay đến khách → 8. Giao hàng thành công
```

---

## 🔄 Chi Tiết Từng Bước

### **BƯỚC 1-4: Đặt Hàng và Thanh Toán** (Đã hoàn thiện)

Tham khảo: [API_TESTING.md](API_TESTING.md)

- Customer đặt hàng và thanh toán
- Order status: `CREATED` → `PENDING_PAYMENT` → `PAID`

---

### **BƯỚC 5: Tạo Delivery Record**

Sau khi order được thanh toán thành công (`PAID`), hệ thống tự động hoặc manual tạo delivery.

#### API: Tạo Delivery
```http
POST /api/v1/deliveries
Authorization: Bearer <store_owner_token>
Content-Type: application/json

{
  "orderId": 1,
  "pickupStoreId": 1,
  "dropoffAddressSnapshot": "{\"address\":\"123 Main St\",\"lat\":10.772622,\"lng\":106.670172}"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Delivery created successfully",
  "result": {
    "id": 1,
    "orderId": 1,
    "orderCode": "ORD20250103001",
    "currentStatus": "QUEUED",
    "pickupStoreId": 1,
    "pickupStoreName": "Quán Cơm Tấm Sườn",
    "dropoffAddressSnapshot": "{...}",
    "createdAt": "2025-01-03T10:00:00"
  }
}
```

**Trạng thái Delivery:** `QUEUED` (Đang chờ xử lý)

---

### **BƯỚC 6: Gán Drone Cho Delivery**

Có 2 cách gán drone:

#### **Cách 1: Tự động tìm drone phù hợp** (Khuyến nghị)

```http
POST /api/v1/deliveries/{deliveryId}/auto-assign-drone
Authorization: Bearer <admin_token>
```

Hệ thống sẽ:
- Tìm drone có đủ pin
- Gần nhất với cửa hàng
- Có đủ payload cho đơn hàng
- Đang ở trạng thái `AVAILABLE`

**Response:**
```json
{
  "code": 200,
  "message": "Drone auto-assigned successfully",
  "result": {
    "id": 1,
    "droneId": 3,
    "droneCode": "DRONE003",
    "currentStatus": "ASSIGNED",
    "estimatedFlightTimeMinutes": 15,
    "distanceKm": 5.2
  }
}
```

#### **Cách 2: Gán drone thủ công**

```http
POST /api/v1/deliveries/{deliveryId}/assign-drone?droneId=3
Authorization: Bearer <admin_token>
```

**Trạng thái:**
- Delivery: `QUEUED` → `ASSIGNED`
- Drone: `AVAILABLE` → `IN_FLIGHT`
- Order: `PAID` (không đổi)

---

### **BƯỚC 7: Drone Cất Cánh (Launch)**

Khi drone sẵn sàng và bắt đầu bay:

```http
POST /api/v1/deliveries/{deliveryId}/launch
Authorization: Bearer <store_owner_token>
```

**Response:**
```json
{
  "code": 200,
  "message": "Delivery launched successfully",
  "result": {
    "id": 1,
    "currentStatus": "LAUNCHED",
    "actualDepartureTime": "2025-01-03T10:15:00"
  }
}
```

**Trạng thái:**
- Delivery: `ASSIGNED` → `LAUNCHED`
- Order: `PAID` → `IN_DELIVERY`
- Drone: `IN_FLIGHT`

---

### **BƯỚC 8: Cập Nhật Vị Trí Drone** (Real-time GPS)

Trong lúc drone bay, app simulator hoặc drone thật sẽ gửi GPS updates:

```http
POST /drones/{droneCode}/location
Content-Type: application/json

{
  "latitude": 10.765622,
  "longitude": 106.665172,
  "altitude": 50,
  "speed": 15,
  "batteryPercent": 75
}
```

**Luồng:**
1. Drone bay từ base → cửa hàng
2. Đến cửa hàng, lấy hàng
3. Bay từ cửa hàng → khách hàng
4. Liên tục gửi GPS updates

---

### **BƯỚC 9: Drone Đang Đến** (Arriving)

Khi drone gần đến điểm giao hàng (ví dụ: trong bán kính 500m):

```http
POST /api/v1/deliveries/{deliveryId}/arriving
Authorization: Bearer <system_token>
```

**Response:**
```json
{
  "code": 200,
  "message": "Delivery marked as arriving",
  "result": {
    "currentStatus": "ARRIVING",
    "estimatedArrivalTime": "2025-01-03T10:30:00"
  }
}
```

**Trạng thái:**
- Delivery: `LAUNCHED` → `ARRIVING`
- Order: `IN_DELIVERY`

Khách hàng có thể nhận notification: "Drone đang đến gần!"

---

### **BƯỚC 10: Giao Hàng Thành Công** (Completed)

Khi drone đã giao hàng thành công:

```http
POST /api/v1/deliveries/{deliveryId}/complete
Authorization: Bearer <system_token>
```

**Response:**
```json
{
  "code": 200,
  "message": "Delivery completed successfully",
  "result": {
    "currentStatus": "COMPLETED",
    "actualArrivalTime": "2025-01-03T10:30:00"
  }
}
```

**Trạng thái:**
- Delivery: `ARRIVING` → `COMPLETED`
- Order: `IN_DELIVERY` → `DELIVERED`
- Drone: `IN_FLIGHT` → `AVAILABLE`

---

## 📊 Các Trạng Thái Delivery

| Status | Mô Tả | Có thể chuyển sang |
|--------|-------|-------------------|
| `QUEUED` | Đang chờ gán drone | `ASSIGNED` |
| `ASSIGNED` | Đã gán drone | `LAUNCHED`, `FAILED` |
| `LAUNCHED` | Drone đã cất cánh | `ARRIVING`, `FAILED`, `RETURNED` |
| `ARRIVING` | Drone đang đến gần | `COMPLETED`, `FAILED`, `RETURNED` |
| `COMPLETED` | Giao hàng thành công | - (terminal) |
| `FAILED` | Giao hàng thất bại | - (terminal) |
| `RETURNED` | Drone quay về | - (terminal) |

---

## 🚁 Quản Lý Drone

### Lấy danh sách drone khả dụng

```http
GET /drones
```

### Tìm drone phù hợp cho delivery

```http
GET /drones/find-available?weightGram=500&fromLat=10.762622&fromLng=106.660172&toLat=10.772622&toLng=106.670172
```

### Lấy delivery hiện tại của drone

```http
GET /drones/{droneCode}/current-delivery
```

**Response:**
```json
{
  "code": 1000,
  "result": {
    "id": 1,
    "orderId": 1,
    "currentStatus": "LAUNCHED",
    "pickupStoreId": 1,
    "dropoffAddressSnapshot": "{...}"
  }
}
```

### Kiểm tra drone gần nhất

```http
GET /drones/nearby?lat=10.762622&lng=106.660172&radiusKm=5.0
```

---

## 🔍 Tracking & Monitoring

### Theo dõi delivery theo order

```http
GET /api/v1/deliveries/order/{orderId}
Authorization: Bearer <token>
```

### Xem tất cả delivery đang chờ

```http
GET /api/v1/deliveries/queued
Authorization: Bearer <admin_token>
```

### Xem lịch sử delivery của drone

```http
GET /api/v1/deliveries/drone/{droneId}
Authorization: Bearer <admin_token>
```

---

## ⚠️ Xử Lý Sự Cố

### Giao hàng thất bại

```http
PUT /api/v1/deliveries/{deliveryId}/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "FAILED",
  "notes": "Bad weather condition"
}
```

**Hậu quả:**
- Order status → `CANCELLED`
- Drone → `AVAILABLE`
- Có thể tạo refund cho khách

### Drone quay về

```http
PUT /api/v1/deliveries/{deliveryId}/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "RETURNED",
  "notes": "Low battery, returning to base"
}
```

**Hậu quả:**
- Order status → `CANCELLED`
- Drone → `AVAILABLE` (về base sạc pin)

---

## 🧪 Test Luồng Đầy Đủ với Postman

### Scenario: Giao hàng thành công từ đầu đến cuối

**1. Tạo order và thanh toán** (đã có trong API_TESTING.md)
```
POST /api/v1/orders
POST /api/v1/payments/init
```

**2. Tạo delivery**
```
POST /api/v1/deliveries
{
  "orderId": 1,
  "pickupStoreId": 1,
  "dropoffAddressSnapshot": "{...}"
}
```

**3. Tự động gán drone**
```
POST /api/v1/deliveries/1/auto-assign-drone
```

**4. Drone cất cánh**
```
POST /api/v1/deliveries/1/launch
```

**5. Cập nhật GPS (lặp lại nhiều lần)**
```
POST /drones/DRONE003/location
{
  "latitude": 10.765000,
  "longitude": 106.665000,
  "batteryPercent": 80
}
```

**6. Đang đến gần**
```
POST /api/v1/deliveries/1/arriving
```

**7. Giao hàng thành công**
```
POST /api/v1/deliveries/1/complete
```

**8. Kiểm tra kết quả**
```
GET /api/v1/orders/1
GET /api/v1/deliveries/order/1
GET /drones/DRONE003
```

---

## 🎯 Best Practices

### 1. **Tự động hóa luồng**
- Sau khi order `PAID`, tự động tạo delivery
- Tự động gán drone thay vì manual
- Auto transition `ARRIVING` khi distance < 500m

### 2. **Giám sát pin drone**
```http
POST /drones/{droneCode}/monitor-battery
```

Nếu pin < 20%, tự động chuyển về base

### 3. **Safety mode**
```http
POST /drones/{droneCode}/safety-mode?reason=Heavy+rain
```

Dừng tất cả delivery trong điều kiện xấu

### 4. **Logging**
- Log mọi status transition
- Track GPS history
- Monitor delivery time

---

## 📱 Integration với Frontend

### Real-time tracking
```javascript
// WebSocket hoặc Polling
setInterval(() => {
  fetch(`/api/v1/deliveries/order/${orderId}`)
    .then(res => res.json())
    .then(data => {
      updateDronePosition(data.drone.latitude, data.drone.longitude);
      updateStatus(data.currentStatus);
    });
}, 5000); // Update mỗi 5 giây
```

### Hiển thị trên map
```javascript
// Google Maps API
const droneMarker = new google.maps.Marker({
  position: {lat: drone.latitude, lng: drone.longitude},
  icon: '/images/drone-icon.png',
  map: map
});
```

---

## 🔐 Phân Quyền

| Role | Quyền |
|------|-------|
| **Customer** | Xem delivery của mình |
| **Store Owner** | Tạo delivery, launch drone |
| **Admin** | Toàn quyền quản lý delivery & drone |
| **System** | Auto-assign, auto-update status |

---

## 📈 Metrics & Analytics

### KPIs cần theo dõi:
- **Delivery success rate**: % giao thành công
- **Average delivery time**: Thời gian trung bình
- **Drone utilization**: % thời gian drone hoạt động
- **Failed deliveries**: Số lần thất bại và lý do

### Sample queries:
```sql
-- Success rate
SELECT 
  COUNT(CASE WHEN current_status = 'COMPLETED' THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM delivery;

-- Average time
SELECT 
  AVG(TIMESTAMPDIFF(MINUTE, actual_departure_time, actual_arrival_time)) as avg_minutes
FROM delivery
WHERE current_status = 'COMPLETED';
```

---

## 🚀 Roadmap

### Phase 1 (Current): Basic Delivery
- [x] Manual delivery creation
- [x] Manual drone assignment
- [x] Status tracking

### Phase 2: Automation
- [ ] Auto-create delivery after payment
- [ ] Auto-assign best drone
- [ ] Auto-update status based on GPS

### Phase 3: Intelligence
- [ ] Predict delivery time with AI
- [ ] Optimize drone routes
- [ ] Dynamic pricing based on distance

### Phase 4: Scale
- [ ] Multiple drones per delivery (fleet)
- [ ] Multi-stop deliveries
- [ ] Drone swarm coordination

---

**Version:** 1.0.0  
**Last Updated:** January 3, 2025  
**Status:** ✅ Ready for Testing

