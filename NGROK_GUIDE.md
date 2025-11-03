# 🌐 Hướng Dẫn Sử Dụng ngrok với Docker

## 📋 Những gì đã thay đổi

### ✅ Cấu hình mới:
1. **MySQL**: Dùng MySQL localhost (không dùng MySQL trong Docker)
2. **ngrok**: Tự động expose app ra internet với HTTPS
3. **phpMyAdmin**: Vẫn dùng được, kết nối tới MySQL localhost

---

## 🚀 Cách Sử Dụng

### Bước 1: Lấy ngrok Auth Token

1. Truy cập: https://dashboard.ngrok.com/get-started/your-authtoken
2. Đăng ký/Đăng nhập tài khoản ngrok (miễn phí)
3. Copy Auth Token của bạn

### Bước 2: Tạo file `.env`

```bash
# Tạo file .env từ template
copy .env.example .env
```

Mở file `.env` và thay thế:
```env
NGROK_AUTHTOKEN=2kX... # Paste token của bạn vào đây
```

### Bước 3: Đảm bảo MySQL localhost đang chạy

```bash
# Kiểm tra MySQL đang chạy
mysql -uroot -pkhang141204 -e "SHOW DATABASES;"

# Kiểm tra database drone_delivery tồn tại
mysql -uroot -pkhang141204 -e "USE drone_delivery; SHOW TABLES;"
```

### Bước 4: Chạy Docker Compose

```bash
# Build và start tất cả services
docker-compose up -d --build

# Xem logs
docker-compose logs -f
```

### Bước 5: Lấy ngrok Public URL

**Cách 1: Xem Web Interface**
```
Mở browser: http://localhost:4040
```

**Cách 2: Xem logs**
```bash
docker-compose logs ngrok
```

Tìm dòng:
```
url=https://abc123.ngrok-free.app
```

### Bước 6: Sử dụng ngrok URL

Copy URL ngrok (ví dụ: `https://abc123.ngrok-free.app`) và dùng cho:

**VNPay Return URL:**
```http
POST /api/v1/payments/init
{
  "orderId": 1,
  "returnUrl": "https://abc123.ngrok-free.app/home/api/v1/payments/vnpay-return"
}
```

**Test API từ bên ngoài:**
```bash
curl https://abc123.ngrok-free.app/home/api/v1/health
```

---

## 🎯 Các Service và Port

| Service | Port | URL | Mô tả |
|---------|------|-----|-------|
| **Spring Boot App** | 8080 | http://localhost:8080/home | API local |
| **ngrok Public** | - | https://xyz.ngrok-free.app | API công khai (HTTPS) |
| **ngrok Dashboard** | 4040 | http://localhost:4040 | Xem traffic, URL |
| **phpMyAdmin** | 8081 | http://localhost:8081 | Quản lý MySQL localhost |
| **MySQL** | 3306 | localhost:3306 | Database (host) |

---

## 🔍 Kiểm Tra Hoạt Động

### 1. Kiểm tra các container
```bash
docker-compose ps

# Kết quả mong đợi:
# food-fast-app     Up (healthy)   0.0.0.0:8080->8080/tcp
# ngrok-service     Up             0.0.0.0:4040->4040/tcp
# foodfast-phpmyadmin Up           0.0.0.0:8081->80/tcp
```

### 2. Kiểm tra kết nối MySQL
```bash
# Xem logs app
docker-compose logs food-fast-app | findstr "mysql"

# Nếu thành công sẽ thấy:
# HikariPool-1 - Start completed
```

### 3. Test API qua ngrok
```bash
# Lấy ngrok URL từ dashboard
# Ví dụ: https://abc123.ngrok-free.app

# Test
curl https://abc123.ngrok-free.app/home/api/v1/health
```

---

## 📊 ngrok Web Interface (Port 4040)

Truy cập: **http://localhost:4040**

Bạn sẽ thấy:
- ✅ **Public URL**: URL HTTPS để share
- ✅ **Request History**: Tất cả requests qua ngrok
- ✅ **Replay**: Test lại request
- ✅ **Status**: Connection status

---

## 🐛 Troubleshooting

### Lỗi: "ngrok authentication failed"

**Nguyên nhân**: Auth token không hợp lệ

**Giải pháp**:
```bash
# Kiểm tra file .env
cat .env | findstr NGROK_AUTHTOKEN

# Hoặc đặt trực tiếp trong docker-compose.yml
# Thay YOUR_AUTH_TOKEN_HERE bằng token thật
```

### Lỗi: "Cannot connect to MySQL"

**Nguyên nhân**: Docker không kết nối được tới MySQL localhost

**Giải pháp**:
```bash
# 1. Kiểm tra MySQL đang chạy
mysql -uroot -pkhang141204 -e "SELECT 1;"

# 2. Kiểm tra MySQL bind-address
# Mở: C:\ProgramData\MySQL\MySQL Server 8.0\my.ini
# Tìm: bind-address = 127.0.0.1
# Đảm bảo MySQL listen trên 0.0.0.0 hoặc 127.0.0.1

# 3. Restart MySQL service (Windows)
net stop MySQL80
net start MySQL80

# 4. Restart app container
docker-compose restart food-fast-app
```

### Lỗi: "port 8080 already in use"

**Giải pháp**:
```bash
# Tìm process đang dùng port 8080
netstat -ano | findstr :8080

# Kill process (thay <PID> bằng số thực)
taskkill /PID <PID> /F

# Hoặc đổi port trong docker-compose.yml
# ports:
#   - "8090:8080"  # Dùng port 8090 thay vì 8080
```

### ngrok URL thay đổi mỗi lần restart

**Nguyên nhân**: Free plan của ngrok cấp URL random

**Giải pháp tạm thời**:
```bash
# Sau mỗi lần restart, lấy URL mới từ:
docker-compose logs ngrok | findstr "url="

# Hoặc xem tại: http://localhost:4040
```

**Giải pháp dài hạn** (Paid plan):
- Upgrade ngrok để có static domain
- Hoặc dùng Cloudflare Tunnel (miễn phí)

---

## 💡 Demo với ngrok

### Kịch bản demo hoàn chỉnh:

```bash
# 1. Start services
docker-compose up -d

# 2. Đợi ~30s cho app ready
docker-compose logs -f food-fast-app

# 3. Lấy ngrok URL
start http://localhost:4040

# 4. Copy URL (ví dụ: https://abc123.ngrok-free.app)

# 5. Test API
curl https://abc123.ngrok-free.app/home/api/v1/auth/login

# 6. Dùng URL này cho VNPay returnUrl
```

---

## 🔄 Lệnh Thường Dùng

```bash
# Start tất cả
docker-compose up -d

# Xem logs tất cả
docker-compose logs -f

# Xem logs chỉ ngrok
docker-compose logs -f ngrok

# Restart ngrok (nếu cần URL mới)
docker-compose restart ngrok

# Stop tất cả
docker-compose down

# Rebuild app
docker-compose up -d --build food-fast-app
```

---

## 📝 Lưu Ý Quan Trọng

### ⚠️ MySQL Localhost
- Docker container kết nối tới MySQL qua `host.docker.internal`
- Đảm bảo MySQL localhost đang chạy TRƯỚC khi start Docker
- Database `drone_delivery` phải tồn tại

### ⚠️ ngrok Free Plan Limitations
- URL thay đổi mỗi lần restart
- Giới hạn 40 connections/phút
- Session timeout sau 2 giờng
- Đủ cho demo và development

### ⚠️ Security
- Không commit `.env` vào Git
- Auth token là bí mật, không share
- Production nên dùng domain riêng

---

## 🎓 Tips Demo

1. **Mở trước ngrok dashboard** (localhost:4040) để show traffic real-time
2. **Bookmark ngrok URL** trong session để không phải copy lại
3. **Dùng Postman Environment** để dễ switch giữa localhost và ngrok URL
4. **Show ngrok inspect** để verify VNPay callback

---

## 📞 Support

Nếu gặp vấn đề:

```bash
# Check status
docker-compose ps

# Check logs
docker-compose logs --tail=100

# Check MySQL connection from container
docker exec -it food-fast-app sh
# Inside container:
# wget -O- http://host.docker.internal:3306

# Restart everything
docker-compose restart
```

---

**Version**: 1.0  
**Last Updated**: 31/10/2025

