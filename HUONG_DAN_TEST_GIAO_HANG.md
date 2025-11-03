# 🚁 HƯỚNG DẪN TEST GIAO HÀNG DRONE: ĐIỂM A → ĐIỂM B

## 📋 TỔNG QUAN

Test này sẽ mô phỏng một drone giao hàng từ:
- **Điểm A (Xuất phát):** (10.762622, 106.660172) - Cửa hàng
- **Điểm B (Đích đến):** (10.773622, 106.670172) - Nhà khách hàng
- **Khoảng cách:** ~1.5km
- **Thời gian:** 2-3 phút (test mode)

---

## 🎯 CÁCH 1: TEST TỰ ĐỘNG (KHUYẾN NGHỊ) ⭐⭐⭐

### Bước 1: Khởi động server

```cmd
java -jar target\foodfast-0.0.1-SNAPSHOT.jar
```

Hoặc:

```cmd
start-server.bat
```

Đợi đến khi thấy: `Started FoodfastApplication in X seconds`

### Bước 2: Mở trang test tự động

```
http://localhost:8080/test-drone-delivery-flow.html
```

### Bước 3: Click "CHẠY TỰ ĐỘNG TOÀN BỘ"

Hệ thống sẽ tự động:
1. ✅ Đăng ký drone tại điểm A
2. ✈️ Chuyển sang trạng thái IN_FLIGHT
3. 🗺️ Bay từ A đến B (21 bước)
4. ✅ Hoàn thành và chuyển về AVAILABLE

**Theo dõi log realtime:**
- Màu xanh: Thành công
- Màu xanh dương: Thông tin
- Màu cam: Cảnh báo
- Màu đỏ: Lỗi

---

## 🎮 CÁCH 2: TEST THỦ CÔNG TỪNG BƯỚC

### Bước 1: Mở Drone Simulator

```
http://localhost:8080/home/drone-simulator-mock.html
```

### Bước 2: Đăng ký drone

**Điền thông tin:**
- Drone Code: `DRONE001`
- Start Latitude: `10.762622`
- Start Longitude: `106.660172`

**Click:** `Register & Start`

### Bước 3: Bắt đầu giao hàng

**Click:** `✈️ IN FLIGHT`

Trạng thái chuyển từ AVAILABLE → IN_FLIGHT

### Bước 4: Di chuyển đến điểm B

**Di chuyển về Bắc (11 lần):**
```
Click "⬆️ Move North" x 11 lần
```

**Di chuyển về Đông (10 lần):**
```
Click "➡️ Move East" x 10 lần
```

**Theo dõi:**
- Latitude tăng từ 10.762622 → 10.773622
- Longitude tăng từ 106.660172 → 106.670172
- Battery giảm dần (mỗi 5s giảm 1%)

### Bước 5: Hoàn thành giao hàng

**Click:** `✅ AVAILABLE`

Drone hoàn thành và sẵn sàng nhận đơn mới!

---

## 📊 CÁCH 3: TEST BẰNG POSTMAN

### Bước 1: Import Collection

Mở Postman → Import file:
```
FoodFast_Postman_Collection.json
```

### Bước 2: Thực hiện theo thứ tự

**1. Register Drone**
```
POST http://localhost:8080/home/drones/register

Body:
{
    "code": "DRONE001",
    "model": "Test Drone",
    "maxPayloadGram": 2000,
    "latitude": 10.762622,
    "longitude": 106.660172
}
```

**2. Start Delivery (IN_FLIGHT)**
```
POST http://localhost:8080/home/drones/DRONE001/status

Body:
{
    "status": "IN_FLIGHT"
}
```

**3. Update Location (lặp lại 21 lần)**

Di chuyển về Bắc (11 lần):
```
POST http://localhost:8080/home/drones/DRONE001/location

Body:
{
    "latitude": 10.763622,  // Tăng dần mỗi lần +0.001
    "longitude": 106.660172,
    "batteryPercent": 98    // Giảm dần
}
```

Di chuyển về Đông (10 lần):
```
Body:
{
    "latitude": 10.773622,
    "longitude": 106.661172,  // Tăng dần mỗi lần +0.001
    "batteryPercent": 90
}
```

**4. Complete Delivery (AVAILABLE)**
```
POST http://localhost:8080/home/drones/DRONE001/status

Body:
{
    "status": "AVAILABLE"
}
```

**5. Kiểm tra kết quả**
```
GET http://localhost:8080/home/drones/DRONE001
```

**Kết quả mong đợi:**
```json
{
    "code": 1000,
    "message": null,
    "result": {
        "code": "DRONE001",
        "model": "Test Drone",
        "maxPayloadGram": 2000,
        "status": "AVAILABLE",
        "currentBatteryPercent": 58,
        "lastLatitude": 10.773622,
        "lastLongitude": 106.670172
    }
}
```

---

## ✅ CHECKLIST TEST

Sau khi test xong, kiểm tra:

- [ ] Drone đã đăng ký thành công
- [ ] Status chuyển đổi: AVAILABLE → IN_FLIGHT → AVAILABLE
- [ ] Latitude thay đổi từ 10.762622 → 10.773622
- [ ] Longitude thay đổi từ 106.660172 → 106.670172
- [ ] Battery giảm từ 100% → ~58%
- [ ] lastTelemetryAt được cập nhật realtime
- [ ] Không có lỗi trong log

---

## 🎯 CÁC SCENARIOS MỞ RỘNG

### Scenario 1: Test nhiều đơn liên tiếp
1. Hoàn thành đơn 1 (A → B)
2. Giao đơn 2 (B → C)
3. Giao đơn 3 (C → D)
4. Battery giảm dần

### Scenario 2: Test hết pin giữa đường
1. Set battery = 25% trước khi IN_FLIGHT
2. Sau vài bước, chuyển sang CHARGING
3. Đợi battery lên 100%
4. Tiếp tục giao hàng

### Scenario 3: Test nhiều drone cùng lúc
1. Đăng ký DRONE001, DRONE002, DRONE003
2. Cho cả 3 giao hàng cùng lúc
3. Theo dõi status của từng drone

---

## 📈 MONITORING

### Xem tất cả drones:
```
GET http://localhost:8080/home/drones
```

### Xem drone cụ thể:
```
GET http://localhost:8080/home/drones/DRONE001
```

### Xem current delivery:
```
GET http://localhost:8080/home/drones/DRONE001/current-delivery
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: Port 8080 đã được sử dụng
```cmd
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Lỗi: Failed to fetch
- Kiểm tra server đã chạy chưa
- Kiểm tra URL đúng chưa
- Thử tắt firewall: `turn-off-firewall.bat`

### Lỗi: Drone already exists
- Drone đã được đăng ký rồi
- Dùng code khác: DRONE002, DRONE003...
- Hoặc xóa database và restart

---

## 🎊 KẾT QUẢ MONG ĐỢI

**Log thành công sẽ như này:**

```
[10:30:15] 🚁 Bước 1: Đăng ký drone...
[10:30:16] ✅ Drone DRONE001 đã đăng ký thành công!
[10:30:16] 📍 Vị trí: (10.762622, 106.660172)
[10:30:16] 🔋 Pin: 100%

[10:30:18] ✈️ Bước 2: Chuyển trạng thái sang IN_FLIGHT...
[10:30:19] ✅ Drone đã sẵn sàng bay!
[10:30:19] 🚀 Trạng thái: IN_FLIGHT

[10:30:21] 🗺️ Bước 3: Bắt đầu di chuyển đến điểm B...
[10:30:23] ⬆️ Di chuyển về Bắc... (1/11)
[10:30:23] 📍 Vị trí cập nhật: (10.763622, 106.660172) | 🔋 98%
...
[10:31:05] ➡️ Di chuyển về Đông... (10/10)
[10:31:05] 📍 Vị trí cập nhật: (10.773622, 106.670172) | 🔋 58%
[10:31:05] 🎯 Đã đến điểm B!

[10:31:07] ✅ Bước 4: Hoàn thành giao hàng...
[10:31:08] 🎉 HOÀN THÀNH GIAO HÀNG!
[10:31:08] ✅ Drone đã trở về trạng thái AVAILABLE
[10:31:08] 🔋 Pin còn lại: 58%
[10:31:08] ✨ Test thành công! Drone đã giao hàng từ A đến B
```

---

## 📂 FILES LIÊN QUAN

- `test-drone-delivery-flow.html` - Test tự động có UI
- `drone-simulator-mock.html` - Simulator thủ công
- `test-delivery.html` - Trang hướng dẫn scenarios
- `FoodFast_Postman_Collection.json` - Postman collection
- `START_TESTING.md` - Hướng dẫn tổng quan

---

## 🚀 BẮT ĐẦU NGAY!

**Cách nhanh nhất:**

1. Start server: `java -jar target\foodfast-0.0.1-SNAPSHOT.jar`
2. Mở: `http://localhost:8080/test-drone-delivery-flow.html`
3. Click: `CHẠY TỰ ĐỘNG TOÀN BỘ`
4. Ngồi nhâm nhi cafe và xem log ☕

**Chúc bạn test thành công! 🎉**

