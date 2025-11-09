# 📦 TÀI LIỆU CHỨC NĂNG DRONE - HỆ THỐNG GIAO ĐỒ ĂN NHANH

## 📋 TỔNG QUAN

Hệ thống quản lý drone tự động để giao đồ ăn nhanh, thay thế shipper truyền thống. Drone có thể tự động bay, cập nhật vị trí GPS, giám sát pin và thực hiện giao hàng trong phạm vi bay an toàn.

---

## 🎯 CÁC CHỨC NĂNG CHÍNH

### 1. **ĐĂNG KÝ & QUẢN LÝ DRONE**

#### 1.1 Đăng ký Drone mới
- **Endpoint:** `POST /drones/register`
- **Mô tả:** Đăng ký một drone mới vào hệ thống (dùng cho phone simulator)
- **Request Body:**
```json
{
  "code": "DRONE001",
  "model": "DJI Mavic 3",
  "maxPayloadGram": 2000,
  "latitude": 10.762622,
  "longitude": 106.660172
}
```
- **Chức năng:**
  - Kiểm tra code drone đã tồn tại chưa
  - Khởi tạo trạng thái AVAILABLE
  - Đặt pin = 100%
  - Lưu vị trí GPS ban đầu

#### 1.2 Lấy danh sách tất cả Drone
- **Endpoint:** `GET /drones`
- **Mô tả:** Lấy danh sách tất cả drone trong hệ thống

#### 1.3 Lấy thông tin Drone theo mã
- **Endpoint:** `GET /drones/{code}`
- **Mô tả:** Lấy thông tin chi tiết của một drone (dùng cho phone login)

---

### 2. **CẬP NHẬT VỊ TRÍ & TRẠNG THÁI**

#### 2.1 Cập nhật vị trí GPS
- **Endpoint:** `POST /drones/{code}/location`
- **Mô tả:** Cập nhật vị trí GPS từ điện thoại (real-time tracking)
- **Request Body:**
```json
{
  "latitude": 10.763456,
  "longitude": 106.661234,
  "batteryPercent": 95
}
```
- **Chức năng:**
  - Cập nhật tọa độ hiện tại (latitude, longitude)
  - Cập nhật mức pin hiện tại
  - Ghi nhận thời gian telemetry mới nhất

#### 2.2 Cập nhật trạng thái Drone
- **Endpoint:** `POST /drones/{code}/status`
- **Mô tả:** Thay đổi trạng thái hoạt động của drone
- **Request Body:**
```json
{
  "status": "CHARGING"
}
```
- **Các trạng thái:**
  - `AVAILABLE` - Sẵn sàng nhận đơn
  - `IN_FLIGHT` - Đang bay giao hàng
  - `CHARGING` - Đang sạc pin
  - `MAINTENANCE` - Bảo trì/sửa chữa
  - `OFFLINE` - Ngoại tuyến

---

### 3. **QUẢN LÝ GIAO HÀNG**

#### 3.1 Lấy đơn hàng hiện tại
- **Endpoint:** `GET /drones/{code}/current-delivery`
- **Mô tả:** Lấy thông tin đơn giao hàng đang thực hiện
- **Trả về:** Delivery với status = ASSIGNED/LAUNCHED/ARRIVING

#### 3.2 Tìm drone phù hợp cho giao hàng
- **Endpoint:** `GET /drones/find-available`
- **Query Params:**
  - `weightGram` - Trọng lượng đơn hàng (gram)
  - `fromLat`, `fromLng` - Tọa độ cửa hàng
  - `toLat`, `toLng` - Tọa độ khách hàng
- **Thuật toán:**
  1. Lọc drone có trạng thái AVAILABLE
  2. Kiểm tra tải trọng tối đa (maxPayloadGram ≥ weightGram)
  3. Tính khoảng cách bay và pin cần thiết
  4. Lọc drone có đủ pin
  5. Sắp xếp theo: khoảng cách đến cửa hàng → mức pin
  6. Chọn drone tối ưu nhất

---

### 4. **GIÁM SÁT PIN & AN TOÀN**

#### 4.1 Giám sát pin tự động
- **Endpoint:** `POST /drones/{code}/monitor-battery`
- **Chức năng:**
  - **Pin < 10%:** Chuyển sang MAINTENANCE (buộc hạ cánh/quay về)
  - **Pin < 20%:** Chuyển sang CHARGING (nếu không đang giao hàng)
  - **Pin < 50%:** Cảnh báo FAIR
  - **Pin ≥ 50%:** Trạng thái tốt

#### 4.2 Kích hoạt chế độ an toàn
- **Endpoint:** `POST /drones/{code}/safety-mode?reason={reason}`
- **Mô tả:** Buộc drone vào trạng thái an toàn (MAINTENANCE)
- **Khi nào sử dụng:**
  - Phát hiện lỗi kỹ thuật
  - Thời tiết xấu
  - Mất tín hiệu liên lạc
  - Can thiệp khẩn cấp

#### 4.3 Kiểm tra sức khỏe Drone
- **Endpoint:** `GET /drones/{code}/health`
- **Trả về:**
```json
{
  "droneCode": "DRONE001",
  "batteryLevel": 85,
  "batteryHealth": "GOOD",
  "connectionHealth": "GOOD",
  "status": "AVAILABLE",
  "lastUpdate": "2025-11-09T10:30:00",
  "overallHealth": "HEALTHY",
  "issues": []
}
```
- **Tiêu chí đánh giá:**
  - **Pin:** CRITICAL (<10%), WARNING (<20%), FAIR (<50%), GOOD (≥50%)
  - **Kết nối:** POOR (không có telemetry >5 phút), GOOD
  - **Tổng thể:** HEALTHY / NEEDS_ATTENTION

---

### 5. **TÍNH TOÁN & ĐỊNH VỊ**

#### 5.1 Tìm drone trong bán kính
- **Endpoint:** `GET /drones/nearby?lat={lat}&lng={lng}&radiusKm={radius}`
- **Mô tả:** Tìm tất cả drone trong bán kính x km từ một điểm
- **Default radius:** 5 km
- **Sử dụng:** Tìm drone gần cửa hàng/khách hàng

#### 5.2 Tính khoảng cách bay
- **Endpoint:** `GET /drones/calculate-distance?fromLat={lat1}&fromLng={lng1}&toLat={lat2}&toLng={lng2}`
- **Mô tả:** Tính khoảng cách và thời gian bay dự kiến
- **Trả về:**
```json
{
  "distanceKm": 2.45,
  "estimatedTimeMinutes": 8
}
```
- **Công thức:** Haversine Formula (tính khoảng cách trên mặt cầu)

---

## 🔧 CẤU TRÚC DỮ LIỆU DRONE

### Entity: Drone
```java
{
  id: Long,
  code: String,              // Mã drone (unique)
  model: String,             // Model drone
  maxPayloadGram: Integer,   // Tải trọng tối đa (gram)
  status: DroneStatus,       // Trạng thái hiện tại
  currentBatteryPercent: Integer, // Mức pin (%)
  lastLatitude: BigDecimal,  // Vĩ độ cuối cùng
  lastLongitude: BigDecimal, // Kinh độ cuối cùng
  lastTelemetryAt: LocalDateTime, // Thời gian cập nhật cuối
  createdAt: LocalDateTime,
  updatedAt: LocalDateTime
}
```

### Enum: DroneStatus
- `AVAILABLE` - Sẵn sàng
- `IN_FLIGHT` - Đang bay
- `CHARGING` - Đang sạc
- `MAINTENANCE` - Bảo trì
- `OFFLINE` - Ngoại tuyến

---

## 📱 TÍCH HỢP VỚI PHONE SIMULATOR

### Flow đăng nhập & hoạt động:
1. **Đăng ký:** POST `/drones/register` với thông tin drone
2. **Login:** GET `/drones/{code}` để lấy thông tin
3. **Cập nhật GPS:** POST `/drones/{code}/location` (mỗi 5-10 giây)
4. **Nhận đơn:** GET `/drones/{code}/current-delivery`
5. **Cập nhật trạng thái:** POST `/drones/{code}/status` khi bắt đầu/kết thúc giao hàng

---

## 🧮 THUẬT TOÁN & LOGIC

### 1. Tính toán Pin cần thiết
```java
int estimateBatteryRequired(distance) {
  // Base: 5% per km
  int baseBattery = (int) Math.ceil(distance * 5);
  // Add 10% safety buffer
  return Math.min(baseBattery + 10, 100);
}
```

### 2. Tính thời gian bay
```java
int estimateFlightTime(distanceKm) {
  double avgSpeedKmPerHour = 30.0; // 30 km/h
  double timeHours = distanceKm / avgSpeedKmPerHour;
  return (int) Math.ceil(timeHours * 60); // Minutes
}
```

### 3. Công thức Haversine (Khoảng cách)
```java
double calculateFlightDistance(lat1, lng1, lat2, lng2) {
  final double R = 6371.0; // Earth radius in km
  
  double dLat = Math.toRadians(lat2 - lat1);
  double dLng = Math.toRadians(lng2 - lng1);
  
  double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(Math.toRadians(lat1)) * 
             Math.cos(Math.toRadians(lat2)) *
             Math.sin(dLng/2) * Math.sin(dLng/2);
             
  double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}
```

---

## 🔐 BẢO MẬT & AN TOÀN

### Cơ chế an toàn tự động:
1. **Pin thấp:** Tự động chuyển về chế độ sạc/bảo trì
2. **Mất kết nối:** Đánh dấu sức khỏe kém nếu >5 phút không có telemetry
3. **Quá tải:** Không cho phép giao hàng vượt maxPayloadGram
4. **Khoảng cách:** Kiểm tra pin đủ cho toàn bộ hành trình

---

## 📊 TÍCH HỢP VỚI CÁC MODULE KHÁC

### 1. Module Delivery
- Gán drone cho đơn hàng
- Theo dõi trạng thái giao hàng
- Cập nhật vị trí real-time

### 2. Module Location
- Kiểm tra cửa hàng trong phạm vi bay an toàn
- Tính khoảng cách giao hàng
- Xác định drone gần nhất

### 3. Module Order
- Xác nhận khả năng giao hàng
- Tính phí ship dựa trên khoảng cách
- Kiểm tra trọng lượng đơn hàng

---

## 🚀 LUỒNG HOẠT ĐỘNG HOÀN CHỈNH

### Quy trình giao hàng từ A-Z:

```
1. Khách đặt hàng → Order created
   ↓
2. System tìm drone phù hợp
   - GET /drones/find-available
   - Check: status, payload, battery, distance
   ↓
3. Gán drone cho delivery
   - Drone status → IN_FLIGHT
   - Delivery status → ASSIGNED
   ↓
4. Drone bay đến cửa hàng
   - Cập nhật GPS liên tục
   - POST /drones/{code}/location
   ↓
5. Lấy hàng & cất cánh
   - Delivery status → LAUNCHED
   ↓
6. Bay đến khách hàng
   - Cập nhật GPS real-time
   - Monitor battery
   ↓
7. Giao hàng thành công
   - Delivery status → COMPLETED
   - Drone status → AVAILABLE
   - Order status → DELIVERED
```

---

## 📞 CONTACT & SUPPORT

**Hệ thống:** FoodFast Drone Delivery  
**Version:** 1.0.0  
**Last Updated:** November 9, 2025

---

## 📝 GHI CHÚ

- Tải trọng tối đa khuyến nghị: **2000g** (2kg)
- Bán kính bay an toàn: **5km** (có thể cấu hình)
- Tốc độ bay trung bình: **30 km/h**
- Pin tối thiểu để nhận đơn: **20%**
- Khoảng cách cập nhật GPS: **5-10 giây**

---

**🎯 Mục tiêu:** Giao đồ ăn nhanh, an toàn, tự động bằng drone trong phạm vi đô thị.

