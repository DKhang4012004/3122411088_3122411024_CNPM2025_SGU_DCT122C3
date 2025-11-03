# 🚀 QUICK START - Test Giao Hàng Drone

## ⚡ Cách nhanh nhất (2 bước)

### 1️⃣ Khởi động server

```cmd
java -jar target\foodfast-0.0.1-SNAPSHOT.jar
```

Đợi đến khi thấy: `Started FoodfastApplication`

### 2️⃣ Chạy test

**Option A - Tự động có UI (Khuyến nghị):**
```cmd
test-drone-flow.bat
```

Hoặc mở trực tiếp:
```
http://localhost:8080/test-drone-delivery-flow.html
```

**Option B - Simulator thủ công:**
```
http://localhost:8080/home/drone-simulator-mock.html
```

---

## 📋 Test Flow A → B

### Tự động (Recommended)
1. Mở: `http://localhost:8080/test-drone-delivery-flow.html`
2. Click: **"🚀 CHẠY TỰ ĐỘNG TOÀN BỘ"**
3. Xem log realtime ✨

### Thủ công
1. Click "Thực hiện" từng bước: 1 → 2 → 3 → 4
2. Theo dõi quá trình bay trên log

---

## 🎯 Điểm xuất phát và đích đến

```
📍 Điểm A (Cửa hàng):
   Latitude:  10.762622
   Longitude: 106.660172

      ⬇️ ~1.5km ⬇️
   (11 bước Bắc + 10 bước Đông)

🎯 Điểm B (Khách hàng):
   Latitude:  10.773622
   Longitude: 106.670172
```

---

## ✅ Kết quả mong đợi

Sau khi test xong, bạn sẽ thấy:

```
✅ Drone DRONE001 đã đăng ký thành công!
📍 Vị trí: (10.762622, 106.660172)
🔋 Pin: 100%

🚀 Trạng thái: IN_FLIGHT

⬆️ Di chuyển về Bắc... (1/11)
⬆️ Di chuyển về Bắc... (2/11)
...
➡️ Di chuyển về Đông... (1/10)
➡️ Di chuyển về Đông... (2/10)
...
🎯 Đã đến điểm B!
📍 Vị trí cuối: (10.773622, 106.670172)

🎉 HOÀN THÀNH GIAO HÀNG!
✅ Drone đã trở về trạng thái AVAILABLE
🔋 Pin còn lại: 58%
```

---

## 🔍 Kiểm tra kết quả

### Xem thông tin drone:
```
http://localhost:8080/home/drones/DRONE001
```

**Response:**
```json
{
  "code": 1000,
  "result": {
    "code": "DRONE001",
    "status": "AVAILABLE",
    "currentBatteryPercent": 58,
    "lastLatitude": 10.773622,
    "lastLongitude": 106.670172
  }
}
```

### Xem tất cả drones:
```
http://localhost:8080/home/drones
```

---

## 🛠️ Troubleshooting

### Server không khởi động?
```cmd
# Kiểm tra port 8080
netstat -ano | findstr :8080

# Kill process nếu cần
taskkill /PID <PID> /F
```

### Lỗi "Failed to fetch"?
- Server chưa sẵn sàng → Đợi thêm 10s
- Firewall chặn → Chạy: `turn-off-firewall.bat`

### Muốn test lại?
- Dùng drone code khác: DRONE002, DRONE003...
- Hoặc restart server

---

## 📚 Tài liệu đầy đủ

Xem chi tiết: `HUONG_DAN_TEST_GIAO_HANG.md`

---

## 🎊 LET'S GO!

```cmd
# Terminal 1: Start server
java -jar target\foodfast-0.0.1-SNAPSHOT.jar

# Terminal 2: Run test
test-drone-flow.bat
```

**Hoặc chỉ 1 dòng:**
```
start-server.bat
```

Rồi mở: http://localhost:8080/test-drone-delivery-flow.html

**Happy Testing! 🚁✨**

