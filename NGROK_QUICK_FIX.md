# 🚨 QUICK FIX: Lỗi "Không tìm thấy website" khi thanh toán VNPay

## ❌ Vấn đề

Khi gọi `/api/v1/payments/init`, URL trả về là:
```
https://shieldless-pamula-adhesively.ngrok-free.dev/...
```

URL này **KHÔNG hoạt động** vì:
- Ngrok đã dừng hoặc restart
- URL ngrok cũ đã expire
- Hệ thống đang dùng URL cached

---

## ✅ GIẢI PHÁP NHANH (3 bước)

### **Bước 1: Khởi động ngrok**

Mở **Command Prompt mới** và chạy:

```bash
ngrok http 8080
```

Hoặc double-click file `start-ngrok.bat` trong thư mục project.

**Chờ cho đến khi thấy:**
```
Forwarding    https://abc-xyz-123.ngrok-free.app -> http://localhost:8080
```

✅ Giữ cửa sổ này **MỞ** (đừng đóng ngrok)

---

### **Bước 2: Refresh ngrok URL cache**

Gọi API để clear cache và lấy URL mới:

**Postman:**
```http
POST http://localhost:8080/home/api/v1/ngrok/refresh
```

**Response:**
```json
{
  "code": 200,
  "message": "Ngrok URL cache cleared and refreshed",
  "result": {
    "publicUrl": "https://abc-xyz-123.ngrok-free.app",
    "isNgrokRunning": true,
    "callbackUrl": "https://abc-xyz-123.ngrok-free.app/home/api/v1/payments/vnpay-return"
  }
}
```

✅ Check `isNgrokRunning = true` và `publicUrl` là URL mới

---

### **Bước 3: Thử lại thanh toán**

Gọi lại API payment init:

```http
POST http://localhost:8080/home/api/v1/payments/init
{
  "orderId": 2,
  "provider": "VNPAY",
  "method": "QR"
}
```

**Lần này URL sẽ là:**
```
https://abc-xyz-123.ngrok-free.app/home/api/v1/payments/vnpay-return
```

✅ Copy URL payment và mở trên browser → Sẽ hoạt động!

---

## 🔍 KIỂM TRA NGROK STATUS

Nếu không chắc ngrok có đang chạy không, gọi:

```http
GET http://localhost:8080/home/api/v1/ngrok/status
```

**Response nếu ngrok CHẠY:**
```json
{
  "code": 200,
  "message": "Ngrok is running",
  "result": {
    "isNgrokRunning": true,
    "currentUrl": "https://abc-xyz.ngrok-free.app",
    "ngrokWebInterface": "http://localhost:4040"
  }
}
```

**Response nếu ngrok KHÔNG CHẠY:**
```json
{
  "code": 200,
  "message": "Ngrok is not running",
  "result": {
    "isNgrokRunning": false,
    "message": "Please start ngrok with: ngrok http 8080"
  }
}
```

---

## 🎯 XEM NGROK URL HIỆN TẠI

```http
GET http://localhost:8080/home/api/v1/ngrok/url
```

Response:
```json
{
  "code": 200,
  "result": {
    "publicUrl": "https://current-url.ngrok-free.app",
    "isNgrokRunning": true,
    "callbackUrl": "https://current-url.ngrok-free.app/home/api/v1/payments/vnpay-return"
  }
}
```

---

## 📋 WORKFLOW CHUẨN KHI DEMO

1. **Mở Terminal 1**: Chạy Spring Boot
   ```bash
   mvn spring-boot:run
   ```

2. **Mở Terminal 2**: Chạy ngrok
   ```bash
   ngrok http 8080
   ```

3. **Kiểm tra ngrok**: 
   ```
   GET http://localhost:8080/home/api/v1/ngrok/status
   ```

4. **Nếu cần refresh**:
   ```
   POST http://localhost:8080/home/api/v1/ngrok/refresh
   ```

5. **Gọi payment init**:
   ```
   POST http://localhost:8080/home/api/v1/payments/init
   ```

---

## ⚠️ LƯU Ý

### Ngrok URL thay đổi khi:
- Restart ngrok
- Ngrok session timeout (2 giờ với free plan)
- Mất kết nối internet

### Khi URL thay đổi:
1. Gọi `POST /api/v1/ngrok/refresh` để update
2. Thử lại payment init

---

## 🐛 TROUBLESHOOTING

### Vấn đề: "isNgrokRunning: false"
**Giải pháp**: 
```bash
# Start ngrok
ngrok http 8080

# Verify tại http://localhost:4040
```

### Vấn đề: URL vẫn cũ sau khi restart ngrok
**Giải pháp**:
```http
POST http://localhost:8080/home/api/v1/ngrok/refresh
```

### Vấn đề: "Connection refused" khi gọi ngrok API
**Giải pháp**: Ngrok chưa chạy, start ngrok trước

---

## 🎓 DEMO TIPS

**Trước khi demo:**
```bash
# 1. Start ngrok
ngrok http 8080

# 2. Verify URL
curl http://localhost:8080/home/api/v1/ngrok/status

# 3. Ready to demo!
```

**Trong demo:**
- Giữ ngrok terminal mở
- Show ngrok dashboard tại http://localhost:4040
- Nếu lỗi → refresh ngrok URL

---

**Last Updated**: 31/10/2025  
**Version**: 1.1

