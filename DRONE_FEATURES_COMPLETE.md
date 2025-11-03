# 🚁 DRONE SERVICE - CHỨC NĂNG HOÀN CHỈNH

## ✅ TẤT CẢ CHỨC NĂNG HIỆN CÓ

### 📋 **1. QUẢN LÝ CÁ DRONE CƠ BẢN**

#### 1.1. Đăng ký Drone mới
**Endpoint:** `POST /home/drones/register`

**Request:**
```json
{
  "code": "DRONE001",
  "model": "DJI Mavic Pro",
  "maxPayloadGram": 2000,
  "latitude": 10.762622,
  "longitude": 106.660172
}
```

**Response:**
```json
{
  "code": 1000,
  "message": "Drone registered successfully",
  "result": {
    "code": "DRONE001",
    "status": "AVAILABLE",
    "currentBatteryPercent": 100
  }
}
```

#### 1.2. Lấy danh sách tất cả drones
**Endpoint:** `GET /home/drones`

**Response:**
```json
{
  "code": 1000,
  "result": [
    {
      "code": "DRONE001",
      "status": "AVAILABLE",
      "currentBatteryPercent": 85
    }
  ]
}
```

#### 1.3. Lấy thông tin drone theo code
**Endpoint:** `GET /home/drones/{code}`

**Example:** `GET /home/drones/DRONE001`

---

### 📍 **2. CẬP NHẬT VỊ TRÍ & TRẠNG THÁI**

#### 2.1. Cập nhật vị trí GPS
**Endpoint:** `POST /home/drones/{code}/location`

**Request:**
```json
{
  "latitude": 10.773622,
  "longitude": 106.670172,
  "batteryPercent": 78
}
```

**Chức năng:**
- Cập nhật GPS realtime
- Cập nhật battery level
- Tự động update lastTelemetryAt

#### 2.2. Cập nhật trạng thái
**Endpoint:** `POST /home/drones/{code}/status`

**Request:**
```json
{
  "status": "IN_FLIGHT"
}
```

**Các trạng thái:**
- `AVAILABLE` - Sẵn sàng nhận việc
- `IN_FLIGHT` - Đang bay
- `CHARGING` - Đang sạc pin
- `MAINTENANCE` - Bảo trì
- `OFFLINE` - Ngoại tuyến

---

### 🎯 **3. TÌM KIẾM & PHÂN CÔNG DRONE PHÙ HỢP** ⭐ MỚI

#### 3.1. Tìm drone phù hợp cho delivery
**Endpoint:** `GET /home/drones/find-available`

**Query params:**
- `weightGram` - Trọng lượng đơn hàng (gram)
- `fromLat` - Latitude điểm lấy hàng
- `fromLng` - Longitude điểm lấy hàng
- `toLat` - Latitude điểm giao hàng
- `toLng` - Longitude điểm giao hàng

**Example:**
```
GET /home/drones/find-available?weightGram=1500&fromLat=10.762622&fromLng=106.660172&toLat=10.773622&toLng=106.670172
```

**Logic:**
1. ✅ Kiểm tra drone có `status = AVAILABLE`
2. ✅ Kiểm tra `maxPayloadGram >= weightGram`
3. ✅ Tính khoảng cách bay (Haversine formula)
4. ✅ Ước tính pin cần thiết (10% mỗi km + 10% dự phòng)
5. ✅ Kiểm tra `currentBatteryPercent >= requiredBattery`
6. ✅ Sắp xếp theo: Khoảng cách đến pickup point → Battery level
7. ✅ Trả về drone phù hợp nhất

**Response:**
```json
{
  "code": 1000,
  "message": "Available drone found",
  "result": {
    "code": "DRONE001",
    "model": "DJI Mavic Pro",
    "maxPayloadGram": 2000,
    "status": "AVAILABLE",
    "currentBatteryPercent": 85,
    "lastLatitude": 10.760000,
    "lastLongitude": 106.658000
  }
}
```

#### 3.2. Tìm drones gần vị trí
**Endpoint:** `GET /home/drones/nearby`

**Query params:**
- `lat` - Latitude trung tâm
- `lng` - Longitude trung tâm
- `radiusKm` - Bán kính tìm kiếm (km), default = 5.0

**Example:**
```
GET /home/drones/nearby?lat=10.762622&lng=106.660172&radiusKm=3.0
```

**Response:** Danh sách tất cả drones trong bán kính 3km

---

### 🔋 **4. GIÁM SÁT & AN TOÀN** ⭐ MỚI

#### 4.1. Giám sát pin
**Endpoint:** `POST /home/drones/{code}/monitor-battery`

**Chức năng:**
- ✅ Kiểm tra battery level
- ✅ Pin < 10% → Tự động chuyển sang `MAINTENANCE` (bắt buộc hạ cánh)
- ✅ Pin < 20% và không đang bay → Chuyển sang `CHARGING`
- ✅ Đảm bảo an toàn bay

**Example:**
```
POST /home/drones/DRONE001/monitor-battery
```

**Response:**
```json
{
  "code": 1000,
  "message": "Battery monitored",
  "result": {
    "code": "DRONE001",
    "status": "CHARGING",
    "currentBatteryPercent": 18
  }
}
```

#### 4.2. Kích hoạt chế độ an toàn
**Endpoint:** `POST /home/drones/{code}/safety-mode`

**Query param:** `reason` (optional)

**Example:**
```
POST /home/drones/DRONE001/safety-mode?reason=Strong wind detected
```

**Chức năng:**
- ✅ Buộc drone chuyển sang `MAINTENANCE` mode
- ✅ Dừng mọi hoạt động delivery
- ✅ Yêu cầu kiểm tra/sửa chữa

**Use cases:**
- Pin yếu
- Thời tiết xấu
- Phát hiện lỗi kỹ thuật
- Yêu cầu bảo trì

#### 4.3. Kiểm tra sức khỏe drone
**Endpoint:** `GET /home/drones/{code}/health`

**Example:**
```
GET /home/drones/DRONE001/health
```

**Response:**
```json
{
  "code": 1000,
  "result": {
    "droneCode": "DRONE001",
    "batteryLevel": 45,
    "status": "AVAILABLE",
    "lastUpdate": "2025-11-02T00:15:30",
    "batteryHealth": "FAIR",
    "connectionHealth": "GOOD",
    "overallHealth": "HEALTHY",
    "issues": []
  }
}
```

**Health Status:**
- **batteryHealth:**
  - `CRITICAL` - Pin < 10%
  - `WARNING` - Pin < 20%
  - `FAIR` - Pin < 50%
  - `GOOD` - Pin >= 50%

- **connectionHealth:**
  - `POOR` - Không có telemetry > 5 phút
  - `GOOD` - Có telemetry gần đây

- **overallHealth:**
  - `HEALTHY` - Không có vấn đề
  - `NEEDS_ATTENTION` - Có issues cần xử lý

---

### 📊 **5. TÍNH TOÁN & ƯỚC TÍNH** ⭐ MỚI

#### 5.1. Tính khoảng cách bay
**Endpoint:** `GET /home/drones/calculate-distance`

**Query params:**
- `fromLat`, `fromLng` - Điểm xuất phát
- `toLat`, `toLng` - Điểm đích

**Example:**
```
GET /home/drones/calculate-distance?fromLat=10.762622&fromLng=106.660172&toLat=10.773622&toLng=106.670172
```

**Response:**
```json
{
  "code": 1000,
  "result": {
    "distanceKm": 1.52,
    "estimatedTimeMinutes": 4
  }
}
```

**Công thức:**
- **Distance:** Haversine formula (tính khoảng cách cung tròn trên mặt cầu)
- **Time:** Giả định tốc độ trung bình 30 km/h

#### 5.2. Methods hỗ trợ (trong service)
```java
// Tính khoảng cách (km)
double distance = droneService.calculateFlightDistance(lat1, lng1, lat2, lng2);

// Ước tính thời gian bay (phút)
int estimatedTime = droneService.estimateFlightTime(distanceKm);

// Ước tính pin cần thiết (private)
int requiredBattery = estimateBatteryRequired(distanceKm);
// → 10% mỗi km + 10% safety margin
```

---

### 📦 **6. DELIVERY TRACKING**

#### 6.1. Lấy delivery hiện tại
**Endpoint:** `GET /home/drones/{code}/current-delivery`

**Example:**
```
GET /home/drones/DRONE001/current-delivery
```

**Response:**
```json
{
  "code": 1000,
  "result": {
    "id": 123,
    "orderId": 456,
    "currentStatus": "LAUNCHED",
    "actualDepartureTime": "2025-11-02T10:30:00"
  }
}
```

**Trả về `null` nếu không có delivery active**

---

## 🎯 TỔNG HỢP CHỨC NĂNG

### ✅ Đã có đầy đủ:

| Chức năng | Endpoint | Status |
|-----------|----------|--------|
| Đăng ký drone | `POST /drones/register` | ✅ |
| Lấy danh sách drones | `GET /drones` | ✅ |
| Lấy thông tin drone | `GET /drones/{code}` | ✅ |
| Cập nhật vị trí | `POST /drones/{code}/location` | ✅ |
| Cập nhật trạng thái | `POST /drones/{code}/status` | ✅ |
| **Tìm drone phù hợp** | `GET /drones/find-available` | ✅ MỚI |
| **Tìm drones gần** | `GET /drones/nearby` | ✅ MỚI |
| **Giám sát pin** | `POST /drones/{code}/monitor-battery` | ✅ MỚI |
| **Chế độ an toàn** | `POST /drones/{code}/safety-mode` | ✅ MỚI |
| **Kiểm tra sức khỏe** | `GET /drones/{code}/health` | ✅ MỚI |
| **Tính khoảng cách** | `GET /drones/calculate-distance` | ✅ MỚI |
| Lấy delivery hiện tại | `GET /drones/{code}/current-delivery` | ✅ |

---

## 📋 SO SÁNH VỚI YÊU CẦU

### ✅ Đã đáp ứng:

1. ✅ **Phân công drone phù hợp dựa trên pin, tải trọng và khoảng cách**
   - → `findAvailableDroneForDelivery()`

2. ✅ **Lập kế hoạch bay tối ưu**
   - → `calculateFlightDistance()`, `estimateFlightTime()`

3. ✅ **Cập nhật trạng thái đơn hàng theo thời gian thực**
   - → `updateLocation()`, `updateStatus()`

4. ✅ **Giám sát drone và xử lý rủi ro**
   - → `monitorBattery()`, `checkDroneHealth()`

5. ✅ **Kích hoạt chế độ an toàn khi pin yếu hoặc thời tiết xấu**
   - → `enableSafetyMode()`, auto switch to CHARGING/MAINTENANCE

6. ✅ **Drone hạ cánh đúng vị trí, không gây hư hỏng**
   - → `getDronesWithinRadius()` để check geofence
   - → `updateLocation()` để confirm vị trí

7. ✅ **Giao hàng tại vị trí có cạnh/hạ hàng định sẵn**
   - → `getCurrentDelivery()` có `dropoffAddressSnapshot`

### ⏳ Có thể mở rộng (cần Order/Delivery system):

- Assign drone to delivery
- Complete delivery workflow
- Delivery status transitions (ASSIGNED → LAUNCHED → ARRIVING → COMPLETED)

---

## 🚀 CÁCH SỬ DỤNG

### Scenario: Giao hàng từ cửa hàng đến khách

```javascript
// 1. Tìm drone phù hợp
GET /home/drones/find-available?
    weightGram=1500&
    fromLat=10.762622&fromLng=106.660172&
    toLat=10.773622&toLng=106.670172
// → Nhận được DRONE001

// 2. Cập nhật trạng thái bắt đầu bay
POST /home/drones/DRONE001/status
Body: { "status": "IN_FLIGHT" }

// 3. Cập nhật vị trí liên tục (mỗi 2-5 giây)
POST /home/drones/DRONE001/location
Body: { "latitude": 10.765, "longitude": 106.662, "batteryPercent": 95 }

// 4. Giám sát pin trong quá trình bay
POST /home/drones/DRONE001/monitor-battery
// → Auto switch to CHARGING nếu pin < 20%

// 5. Đến nơi, hoàn thành giao hàng
POST /home/drones/DRONE001/status
Body: { "status": "AVAILABLE" }

// 6. Kiểm tra sức khỏe sau chuyến bay
GET /home/drones/DRONE001/health
```

---

## 📊 KẾT LUẬN

**Drone System hiện tại đã có đầy đủ các chức năng chính:**
- ✅ Quản lý drone cơ bản
- ✅ Tracking vị trí realtime
- ✅ Smart assignment dựa trên payload, battery, distance
- ✅ Giám sát an toàn & health check
- ✅ Tính toán khoảng cách & thời gian bay
- ✅ Xử lý tình huống khẩn cấp (low battery, safety mode)

**Chỉ cần bổ sung khi có Order/Delivery system:**
- Assign drone to delivery
- Update delivery status
- Complete delivery workflow

**TẤT CẢ CHỨC NĂNG CORE ĐÃ SẴN SÀNG ĐỂ TEST! 🎉**

