# 🚁 TEST GIAO HÀNG VỚI DRONE

## 📋 FLOW GIAO HÀNG

```
1. Đăng ký Drone → Status: AVAILABLE
2. Thay đổi status → IN_FLIGHT (đang giao hàng)
3. Di chuyển drone đến điểm giao hàng
4. Thay đổi status → AVAILABLE (hoàn thành)
```

---

## 🎮 CÁCH TEST ĐƠN GIẢN

### **Bước 1: Đăng ký Drone**

Trên điện thoại hoặc máy tính, mở:
```
http://192.168.1.86:8080/home/drone-simulator-mock.html
```

Điền thông tin:
- **API Server URL:** `http://192.168.1.86:8080/home`
- **Drone Code:** `DRONE001`
- **Phone Model:** `iPhone 13`
- **Latitude:** `10.762622` (Điểm xuất phát - TP.HCM)
- **Longitude:** `106.660172`

Nhấn **"Register & Start"** → Drone status: **AVAILABLE**

---

### **Bước 2: Bắt đầu giao hàng**

Click nút: **"✈️ IN FLIGHT"**

Lúc này:
- ✅ Drone status → **IN_FLIGHT**
- 🔋 Battery bắt đầu giảm (1%/5 giây)
- 📍 GPS vẫn update liên tục

---

### **Bước 3: Di chuyển đến điểm giao hàng**

Giả sử giao hàng tới: `(10.773622, 106.670172)`

**Cách 1: Dùng nút di chuyển**
- Click **"⬆️ Move North"** 11 lần → Tăng 0.011 latitude
- Click **"➡️ Move East"** 10 lần → Tăng 0.010 longitude

**Cách 2: Dùng Postman**
```http
POST http://localhost:8080/home/drones/DRONE001/location
Content-Type: application/json

{
    "latitude": 10.773622,
    "longitude": 106.670172,
    "batteryPercent": 85
}
```

---

### **Bước 4: Hoàn thành giao hàng**

Click nút: **"✅ AVAILABLE"**

Lúc này:
- ✅ Drone status → **AVAILABLE** (sẵn sàng nhận đơn mới)
- 🔋 Battery ngưng giảm

---

### **Bước 5: Sạc pin (Optional)**

Nếu battery thấp:
1. Click **"🔌 CHARGING"**
2. Battery tăng 2%/5 giây
3. Khi đầy, click **"✅ AVAILABLE"**

---

## 🎯 TEST CASE MẪU

### Test Case 1: Giao hàng thành công
```
1. Register DRONE001 tại (10.762622, 106.660172)
2. Status: AVAILABLE → IN_FLIGHT
3. Di chuyển đến (10.773622, 106.670172)
4. Status: IN_FLIGHT → AVAILABLE
✅ Kết quả: Drone sẵn sàng cho đơn tiếp theo
```

### Test Case 2: Drone hết pin giữa đường
```
1. Register DRONE001
2. Status: AVAILABLE → IN_FLIGHT
3. Chờ battery < 20%
4. Status: IN_FLIGHT → CHARGING (khẩn cấp)
5. Chờ battery = 100%
6. Status: CHARGING → AVAILABLE
✅ Kết quả: Drone an toàn, pin đầy
```

### Test Case 3: Giao nhiều đơn liên tiếp
```
1. Register DRONE001
2. Giao đơn 1: AVAILABLE → IN_FLIGHT → AVAILABLE
3. Giao đơn 2: AVAILABLE → IN_FLIGHT → AVAILABLE
4. Giao đơn 3: AVAILABLE → IN_FLIGHT → CHARGING (pin thấp)
✅ Kết quả: Drone hoạt động liên tục đến khi cần sạc
```

---

## 📱 MỞ 2 TAB ĐỂ THEO DÕI

### Tab 1: Drone Simulator (Điều khiển)
```
http://192.168.1.86:8080/home/drone-simulator-mock.html
```
- Thay đổi status
- Di chuyển drone
- Xem GPS realtime

### Tab 2: Monitor Drones (Theo dõi)
```
http://192.168.1.86:8080/home/drones
```
Hoặc dùng Postman:
```http
GET http://localhost:8080/home/drones/DRONE001
```
- Xem trạng thái drone
- Kiểm tra vị trí
- Theo dõi battery

---

## 🗺️ MÔ PHỎNG TUYẾN ĐƯỜNG GIAO HÀNG

### Tuyến 1: Quận 1 → Quận 3
```
Xuất phát: (10.762622, 106.660172) - Ben Thanh
Đích đến:  (10.773622, 106.670172) - Quận 3
Khoảng cách: ~1.5km

Di chuyển:
- Move North: 11 lần
- Move East: 10 lần
```

### Tuyến 2: Quận 1 → Bình Thạnh
```
Xuất phát: (10.762622, 106.660172) - Ben Thanh  
Đích đến:  (10.805622, 106.710172) - Bình Thạnh
Khoảng cách: ~5.5km

Di chuyển:
- Move North: 43 lần
- Move East: 50 lần
```

---

## 🔍 KIỂM TRA KẾT QUẢ

### Xem tất cả drones
```http
GET http://localhost:8080/home/drones
```

### Xem drone cụ thể
```http
GET http://localhost:8080/home/drones/DRONE001
```

### Kết quả mong đợi
```json
{
    "code": 1000,
    "result": {
        "code": "DRONE001",
        "model": "iPhone 13",
        "status": "AVAILABLE",
        "lastLatitude": 10.773622,
        "lastLongitude": 106.670172,
        "currentBatteryPercent": 85,
        "lastTelemetryAt": "2025-11-01T10:30:00"
    }
}
```

---

## 📊 METRICS CẦN THEO DÕI

### 1. Status Transitions
```
AVAILABLE → IN_FLIGHT → AVAILABLE  ✅ Bình thường
AVAILABLE → IN_FLIGHT → CHARGING   ⚠️ Pin thấp
IN_FLIGHT → OFFLINE               ❌ Mất kết nối
```

### 2. Battery Level
```
100% - 80%: ✅ Tốt
79% - 50%:  ⚠️ Trung bình
49% - 20%:  ⚠️ Thấp
< 20%:      🔴 Nguy hiểm (cần sạc ngay)
```

### 3. GPS Updates
```
Update frequency: Mỗi 5 giây
Last telemetry: < 10 giây → ✅ Online
Last telemetry: > 30 giây → ❌ Offline
```

---

## 🎮 POSTMAN COLLECTION

Import file: `FoodFast_Postman_Collection.json`

Hoặc test thủ công:

### 1. Register Drone
```http
POST {{baseUrl}}/drones/register
{
    "code": "DRONE001",
    "model": "iPhone 13",
    "maxPayloadGram": 2000,
    "latitude": 10.762622,
    "longitude": 106.660172
}
```

### 2. Start Delivery
```http
POST {{baseUrl}}/drones/DRONE001/status
{
    "status": "IN_FLIGHT"
}
```

### 3. Update Location
```http
POST {{baseUrl}}/drones/DRONE001/location
{
    "latitude": 10.773622,
    "longitude": 106.670172,
    "batteryPercent": 85
}
```

### 4. Complete Delivery
```http
POST {{baseUrl}}/drones/DRONE001/status
{
    "status": "AVAILABLE"
}
```

---

## 🎉 KẾT QUẢ MONG ĐỢI

Sau khi test xong, bạn sẽ thấy:

✅ **Drone hoạt động ổn định:**
- Đăng ký thành công
- Chuyển đổi status trơn tru
- GPS update realtime
- Battery simulation chính xác

✅ **Flow giao hàng hoàn chỉnh:**
- Nhận đơn (AVAILABLE)
- Bắt đầu giao (IN_FLIGHT)
- Di chuyển đến địa chỉ
- Hoàn thành (AVAILABLE)

✅ **Xử lý ngoại lệ:**
- Pin thấp → Tự động CHARGING
- Mất kết nối → OFFLINE
- Recovery → AVAILABLE

---

## 💡 TIPS

1. **Test nhiều drone cùng lúc:**
   - Mở nhiều tab Mock GPS
   - Mỗi tab dùng code khác: DRONE001, DRONE002, DRONE003...

2. **Theo dõi realtime:**
   - Tab 1: Drone Simulator (điều khiển)
   - Tab 2: GET /drones (F5 liên tục để refresh)

3. **Mô phỏng thực tế:**
   - Set battery = 30% trước khi giao
   - Kiểm tra drone có tự động CHARGING không

4. **Debug nếu lỗi:**
   - Xem Console log trong Mock GPS
   - Kiểm tra server log
   - Test API bằng Postman trước

---

**Bây giờ bạn có thể bắt đầu test ngay! 🚀**

Bất kỳ thắc mắc gì, cứ hỏi tôi!

