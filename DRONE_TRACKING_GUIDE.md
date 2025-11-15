# 🚁 HỆ THỐNG GIAO HÀNG DRONE TỰ ĐỘNG - FOODFAST

## 📋 TỔNG QUAN

Hệ thống giao hàng bằng drone **tự động hóa hoàn toàn** với visualization map real-time. Sau khi store chấp nhận đơn hàng, drone sẽ tự động:
- ✈️ Cất cánh sau 1 phút
- 📍 Cập nhật vị trí mỗi 5 giây
- 🎯 Bay từ cửa hàng đến khách hàng
- ✅ Tự động hoàn thành giao hàng

---

## 🎯 CÁC FILE ĐÃ TẠO/SỬA

### Backend:
1. **DeliverySimulationService.java** - Service tự động hóa giao hàng
2. **Position.java** - DTO cho tọa độ
3. **DeliveryTrackingResponse.java** - DTO cho tracking info
4. **DeliveryController.java** - Thêm endpoint `/api/v1/deliveries/{id}/tracking`
5. **DeliveryService.java** - Thêm method `getTrackingInfo()` và `calculateProgress()`
6. **OrderServiceImpl.java** - Tích hợp `DeliverySimulationService`
7. **application.yaml** - Thêm config simulation

### Frontend:
8. **delivery-tracking.html** - Trang tracking với Leaflet map

---

## ⚙️ CẤU HÌNH

### application.yaml:
```yaml
app:
  delivery:
    simulation:
      enabled: true                    # Bật/tắt simulation
      prep-time-minutes: 1             # Thời gian chuẩn bị (1 phút)
      update-interval-seconds: 5       # Update vị trí mỗi 5 giây
```

**Production**: Đặt `enabled: false` để tắt simulation

---

## 🚀 CÁCH SỬ DỤNG

### BƯỚC 1: Khởi động server
```powershell
.\start-server.bat
```

### BƯỚC 2: Tạo đơn hàng và thanh toán
1. Vào trang chủ: http://localhost:8080/home
2. Chọn cửa hàng → Thêm món vào giỏ
3. Checkout → Thanh toán VNPay
4. Sau thanh toán, Delivery sẽ tự động tạo (status = QUEUED)

### BƯỚC 3: Store chấp nhận đơn
1. Store owner login vào: http://localhost:8080/home/store-management.html
2. Tab "Quản lý đơn hàng" → Chấp nhận đơn
3. Hệ thống tự động:
   - Gán drone available đầu tiên
   - **BẮT ĐẦU SIMULATION** 🚁
   - Delivery status → ASSIGNED

### BƯỚC 4: Tracking Real-time
Mở trang tracking:
```
http://localhost:8080/home/delivery-tracking.html?deliveryId=<ID>
```

**Lấy deliveryId từ đâu?**
- API: `GET /home/api/v1/deliveries/order/{orderId}`
- Database: Bảng `delivery` → cột `id`
- Console log sau khi accept order

---

## 🎬 TIMELINE TỰ ĐỘNG

```
T+0s:    Store accept order
         ↓
         Drone ASSIGNED
         Delivery simulation started

T+1min:  Drone LAUNCHED (tự động)
         Order status → IN_DELIVERY
         actualDepartureTime ghi nhận

T+1-10min: Drone bay từ store → customer
           Vị trí cập nhật mỗi 5 giây
           Map animation mượt mà

T+8min:  Drone ARRIVING (tự động)
         Progress = 80%

T+10min: Drone COMPLETED (tự động)
         Order status → DELIVERED
         Drone → AVAILABLE
         actualArrivalTime ghi nhận
```

**Thời gian bay**: Dựa vào `estimatedFlightTimeMinutes` trong database (mặc định 10 phút nếu không có)

---

## 🗺️ MAP FEATURES

### Leaflet Map với:
- **Store Icon** (🏪 màu xanh dương)
- **Drone Icon** (🚁 màu cam) - Di chuyển real-time
- **Customer Icon** (📍 màu xanh lá)
- **Flight Path** (đường nét đứt từ store → customer)

### Auto Updates:
- Mỗi 5 giây gọi API tracking
- Drone marker tự động di chuyển
- Progress bar cập nhật
- ETA countdown

### Responsive:
- Desktop: 2 cột (tracking panel + map)
- Mobile: 1 cột (stack vertically)

---

## 📡 API ENDPOINTS

### 1. Get Tracking Info
```http
GET /api/v1/deliveries/{deliveryId}/tracking

Response:
{
  "code": 200,
  "result": {
    "deliveryId": 1,
    "orderId": 5,
    "orderCode": "ORD123",
    "status": "LAUNCHED",
    "dronePosition": {
      "latitude": 10.765,
      "longitude": 106.662
    },
    "storePosition": {
      "latitude": 10.762622,
      "longitude": 106.660172
    },
    "customerPosition": {
      "latitude": 10.772622,
      "longitude": 106.670172
    },
    "progress": 45,
    "distanceKm": 1.2,
    "estimatedArrival": "2025-11-14T23:35:00",
    "actualDeparture": "2025-11-14T23:26:00",
    "droneId": 3,
    "droneModel": "DJI Phantom 5",
    "batteryPercent": 85
  }
}
```

### 2. Get Delivery by Order
```http
GET /api/v1/deliveries/order/{orderId}
```

---

## 🎨 UI COMPONENTS

### Tracking Panel:
- ✅ Order code badge
- ✅ Status badge (màu theo status)
- ✅ Progress bar (0-100%)
- ✅ Distance & ETA
- ✅ Drone info (model, battery)
- ✅ Timeline (5 stages)

### Map:
- ✅ Interactive markers
- ✅ Animated drone movement
- ✅ Flight path visualization
- ✅ Auto zoom/pan
- ✅ Legend overlay

---

## 🔧 TROUBLESHOOTING

### 1. Simulation không chạy:
```yaml
# Check config
app.delivery.simulation.enabled: true
```

### 2. Drone không bay:
- Check log: "🚁 Delivery simulation started"
- Check deliveryId có đúng không
- Verify delivery status = ASSIGNED

### 3. Map không hiển thị:
- Check browser console for errors
- Verify deliveryId trong URL
- Check API response: `/api/v1/deliveries/{id}/tracking`

### 4. Vị trí không update:
- Store và customer phải có coordinates
- Default coordinates nếu không có: HCMC center
- Check drone.lastLatitude, lastLongitude trong DB

---

## 🎯 DEMO SCENARIO

### Scenario 1: Giao hàng thành công
```
1. Customer order + pay → Delivery QUEUED
2. Store accept → Drone ASSIGNED → Simulation starts
3. Wait 1 min → Drone LAUNCHED
4. Watch drone fly on map (1-10 min)
5. Drone ARRIVING → COMPLETED
6. Alert: "Giao hàng thành công!"
```

### Scenario 2: Multiple deliveries
```
1. Accept nhiều orders liên tiếp
2. Mỗi order có 1 drone riêng
3. Xem tất cả drone bay cùng lúc
4. Drone về AVAILABLE sau khi hoàn thành
```

---

## 📊 DATABASE

### Table: delivery
- `current_status`: QUEUED → ASSIGNED → LAUNCHED → ARRIVING → COMPLETED
- `actual_departure_time`: Ghi khi LAUNCHED
- `actual_arrival_time`: Ghi khi COMPLETED

### Table: drone
- `status`: AVAILABLE ↔ IN_FLIGHT
- `last_latitude`, `last_longitude`: Update mỗi 5 giây
- `current_battery_percent`: Giảm dần khi bay

### Table: orders
- `status`: PAID → ACCEPT → IN_DELIVERY → DELIVERED

---

## 🚀 NEXT STEPS

### Testing:
1. ✅ Restart server
2. ✅ Tạo order + thanh toán
3. ✅ Store accept
4. ✅ Mở tracking page
5. ✅ Watch drone fly! 🚁

### Advanced Features (Optional):
- WebSocket cho real-time updates
- Multiple drone tracking cùng lúc
- Flight path optimization (A* algorithm)
- Weather simulation
- Battery drain realistic model
- Geofencing validation

---

## 📝 NOTES

- **Thời gian**: Có thể điều chỉnh trong config
- **Coordinates**: Mặc định dùng HCMC nếu không có
- **Production**: Tắt simulation, dùng real drone GPS
- **Performance**: Scheduler pool size = 10 threads

---

**Tác giả**: AI Assistant
**Ngày**: 2025-11-14
**Version**: 1.0.0

✨ Enjoy your automated drone delivery system! 🚁
