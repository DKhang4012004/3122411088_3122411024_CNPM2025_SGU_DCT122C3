# ✅ SẴN SÀNG TEST DRONE DELIVERY!

## 🎯 BẠN CÓ 3 CÁCH TEST

### **Cách 1: Dùng Test Delivery Page (KHUYẾN NGHỊ)** ⭐⭐⭐

**Trên máy tính:**
```
http://localhost:8080/home/test-delivery.html
```

**Trên điện thoại:**
```
http://192.168.1.86:8080/home/test-delivery.html
```

**Ưu điểm:**
- ✅ Có sẵn 3 scenarios test
- ✅ Hướng dẫn chi tiết từng bước
- ✅ Links đến các tools cần thiết
- ✅ Giao diện đẹp, dễ hiểu

---

### **Cách 2: Dùng Mock GPS Simulator** ⭐⭐

**URL:**
```
http://192.168.1.86:8080/home/drone-simulator-mock.html
```

**Các bước:**
1. Register drone → Status: AVAILABLE
2. Click "IN_FLIGHT" → Bắt đầu giao hàng
3. Click Move North/East → Di chuyển
4. Click "AVAILABLE" → Hoàn thành

---

### **Cách 3: Dùng Postman** ⭐

Import: `FoodFast_Postman_Collection.json`

**Test flow:**
```
1. POST /drones/register
2. POST /drones/DRONE001/status {"status": "IN_FLIGHT"}
3. POST /drones/DRONE001/location {"latitude": ..., "longitude": ...}
4. POST /drones/DRONE001/status {"status": "AVAILABLE"}
```

---

## 📋 3 SCENARIOS TEST

### Scenario 1: Giao hàng thành công ✅
```
AVAILABLE → IN_FLIGHT → Di chuyển → AVAILABLE
```

### Scenario 2: Hết pin giữa đường 🔋
```
IN_FLIGHT → Battery < 20% → CHARGING → Battery 100% → AVAILABLE
```

### Scenario 3: Giao nhiều đơn liên tiếp 🔄
```
Đơn 1 → Đơn 2 → Đơn 3 → ... → Pin thấp → CHARGING
```

---

## 🚀 BẮT ĐẦU TEST NGAY!

### **Option A: Chạy batch file**
```cmd
test-delivery.bat
```

### **Option B: Mở trực tiếp**

**1. Trên máy tính:**
- Mở: http://localhost:8080/home/test-delivery.html
- Chọn scenario muốn test
- Click "Test Ngay"

**2. Trên điện thoại:**
- Mở: http://192.168.1.86:8080/home/test-delivery.html
- Làm theo hướng dẫn từng scenario

---

## 📊 THEO DÕI KẾT QUẢ

### Xem tất cả drones:
```
http://localhost:8080/home/drones
```

### Xem drone cụ thể:
```
http://localhost:8080/home/drones/DRONE001
```

### Kết quả mong đợi:
```json
{
    "code": 1000,
    "result": {
        "code": "DRONE001",
        "status": "AVAILABLE",
        "currentBatteryPercent": 85,
        "lastLatitude": 10.773622,
        "lastLongitude": 106.670172
    }
}
```

---

## 🎮 STATUS TRANSITIONS

```
✅ AVAILABLE    → Sẵn sàng nhận đơn
     ↓
✈️ IN_FLIGHT   → Đang giao hàng (battery giảm)
     ↓
✅ AVAILABLE    → Hoàn thành (hoặc...)
     ↓
🔌 CHARGING    → Pin thấp, đang sạc (battery tăng)
     ↓
✅ AVAILABLE    → Sẵn sàng lại
```

---

## 💡 TIPS

1. **Mở 2 tabs:**
   - Tab 1: Drone Simulator (điều khiển)
   - Tab 2: GET /drones (xem kết quả)

2. **Test battery:**
   - Set battery = 25% để test nhanh
   - Hoặc chờ IN_FLIGHT tự giảm

3. **Test nhiều drone:**
   - Mở nhiều tabs Simulator
   - Mỗi tab: DRONE001, DRONE002, DRONE003...

4. **Debug nếu lỗi:**
   - Xem Console log
   - Dùng debug-register.html
   - Check Postman

---

## 📂 FILES ĐÃ TẠO

1. ✅ **TEST_DRONE_DELIVERY.md** - Hướng dẫn chi tiết
2. ✅ **test-delivery.html** - Trang test có UI đẹp
3. ✅ **test-delivery.bat** - Script mở nhanh
4. ✅ **README.md** - Đã update với links

---

## 🎉 KẾT QUẢ MONG ĐỢI

Sau khi test xong, bạn sẽ thấy:

✅ **Flow giao hàng hoàn chỉnh**
✅ **Battery simulation chính xác**
✅ **GPS update realtime**
✅ **Status chuyển đổi trơn tru**
✅ **Xử lý ngoại lệ (pin thấp)**

---

## 🚁 BÂY GIỜ HÃY TEST!

**Cách nhanh nhất:**

1. Chạy: `test-delivery.bat`
2. Chọn Scenario 1
3. Click "Test Ngay"
4. Làm theo hướng dẫn

**Hoặc trên điện thoại:**

Mở: `http://192.168.1.86:8080/home/test-delivery.html`

---

**Mọi thứ đã sẵn sàng! Chúc bạn test thành công! 🎊**

