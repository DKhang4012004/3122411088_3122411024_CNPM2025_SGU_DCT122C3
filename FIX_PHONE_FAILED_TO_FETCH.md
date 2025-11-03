# 🔥 GIẢI QUYẾT LỖI "FAILED TO FETCH" TRÊN ĐIỆN THOẠI

## ❌ Vấn đề
- Test trên máy tính với IP 192.168.1.86: ✅ Hoạt động
- Test trên điện thoại: ❌ "Connection error: Failed to fetch"

## 🔍 Nguyên nhân
**Windows Firewall đang chặn kết nối từ điện thoại đến port 8080**

---

## ✅ GIẢI PHÁP (Chọn 1 trong 2)

### **Cách 1: Tắt Windows Firewall tạm thời (NHANH NHẤT)** ⭐⭐⭐

**Bước 1: Mở Windows Firewall**
1. Nhấn `Win + R`
2. Gõ: `firewall.cpl`
3. Nhấn Enter

**Bước 2: Tắt Firewall**
1. Click "Turn Windows Defender Firewall on or off" (bên trái)
2. Chọn "Turn off Windows Defender Firewall" cho cả:
   - ✅ Private network settings
   - ✅ Public network settings
3. Click OK

**Bước 3: Test lại trên điện thoại**

⚠️ **QUAN TRỌNG:** Phải dùng URL có chữ **"-mock"**:
```
http://192.168.1.86:8080/home/drone-simulator-mock.html
```

❌ **KHÔNG DÙNG** URL này (sẽ bị lỗi GPS):
```
http://192.168.1.86:8080/home/drone-simulator.html
```

**✅ Sẽ hoạt động ngay!**

---

### **Cách 2: Cho phép Port 8080 (KHUYẾN NGHỊ cho dài hạn)** ⭐⭐

**Option A: Dùng Script tự động**
1. Chuột phải vào file: `allow-firewall.bat`
2. Chọn "Run as administrator"
3. Chờ hoàn tất

**Option B: Cấu hình thủ công**
1. Mở Windows Defender Firewall
2. Click "Advanced settings" (bên trái)
3. Click "Inbound Rules" → "New Rule..."
4. Chọn:
   - Rule Type: **Port**
   - Protocol: **TCP**
   - Specific local ports: **8080**
   - Action: **Allow the connection**
   - Profile: Chọn tất cả (Domain, Private, Public)
   - Name: **FoodFast Server**
5. Click Finish

---

## 📱 SAU KHI SỬA FIREWALL

### Trên điện thoại, mở trình duyệt:

**1. Test kết nối trước:**
```
http://192.168.1.86:8080/home/test-connection.html
```

**2. Nếu thành công, mở Drone Simulator:**
```
http://192.168.1.86:8080/home/drone-simulator-mock.html
```

**3. Điền form:**
- API Server URL: `http://192.168.1.86:8080/home`
- Drone Code: `DRONE001`
- Phone Model: Tên điện thoại
- Latitude: `10.762622` (có sẵn)
- Longitude: `106.660172` (có sẵn)

**4. Nhấn "Register & Start"** ✅

---

## 🎯 Checklist

Đảm bảo các điều kiện sau:
- ✅ Server đang chạy (port 8080)
- ✅ Máy tính và điện thoại cùng WiFi
- ✅ Windows Firewall đã tắt HOẶC đã cho phép port 8080
- ✅ Dùng URL Mock GPS (`drone-simulator-mock.html`)
- ✅ API URL đúng: `http://192.168.1.86:8080/home`

---

## 🛠️ Nếu vẫn lỗi

### Test kết nối cơ bản:

**Trên điện thoại:**
```
http://192.168.1.86:8080/home/drones
```

Nếu thấy JSON response → Kết nối OK
Nếu không load được → Kiểm tra lại:
1. Cùng WiFi chưa?
2. Firewall đã tắt chưa?
3. Antivirus có chặn không?

---

## 📞 Script hỗ trợ

Đã tạo sẵn các script giúp bạn:

1. **test-phone-connection.bat**
   - Kiểm tra server đang chạy
   - Lấy địa chỉ IP
   - Kiểm tra Firewall
   - Hiển thị URL để test

2. **allow-firewall.bat**
   - Tự động thêm Firewall rule cho port 8080
   - Cần chạy với quyền Administrator

3. **start-server.bat**
   - Khởi động Spring Boot server

---

## ✅ Kết quả mong đợi

Sau khi làm theo hướng dẫn:
- ✅ Điện thoại kết nối được đến server
- ✅ Drone Simulator hoạt động trên điện thoại
- ✅ Có thể register drone và test các tính năng
- ✅ GPS mock hoạt động, có thể di chuyển drone
- ✅ Thay đổi status, xem battery update

---

**LƯU Ý:** Sau khi test xong, nhớ BẬT LẠI Windows Firewall để bảo mật!

