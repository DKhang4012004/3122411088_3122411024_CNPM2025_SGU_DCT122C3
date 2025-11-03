# 🍔 FoodFast - Drone Delivery System

Hệ thống đặt đồ ăn trực tuyến với giao hàng bằng drone.

## 🚀 Quick Start

### 1. Chuẩn bị

**Yêu cầu:**
- Java 17+
- Maven 3.6+
- MySQL 8.0+
- Ngrok (cho VNPay testing)

### 2. Setup Database

```bash
# Tạo database
mysql -u root -p < demo_database_setup.sql

# Insert test data
insert-test-data.bat
```

### 3. Start Application

```bash
# Start server
start-server.bat

# Start ngrok (optional - for VNPay)
start-ngrok.bat
```

### 4. Access Application

- **Web UI:** http://localhost:8080/home
- **API Docs:** http://localhost:8080/home/swagger-ui.html

---

## 📖 Tài Liệu

### Hướng dẫn chính
1. **COMPLETE_FLOW_GUIDE.md** - Hướng dẫn test đầy đủ từ A-Z
2. **ORDER_FLOW_SIMPLIFIED.md** - Flow xử lý đơn hàng (simplified)
3. **API_ENDPOINTS_COMPLETE.md** - Danh sách API endpoints
4. **ALL_FIXES_COMPLETE.md** - Tổng hợp các fixes

### Postman Collections
- `Complete_Order_Flow_Test.postman_collection.json`
- `Delivery_Complete_Flow.postman_collection.json`
- `Drone_Complete_APIs.postman_collection.json`

---

## 🎯 Flow Hoạt Động

### 1. Khách hàng đặt hàng
```
Trang chủ → Chọn cửa hàng → Thêm món → Giỏ hàng → Thanh toán VNPay
```

### 2. Cửa hàng xử lý
```
store-management.html → Chấp nhận đơn → Chuẩn bị món → Giao cho drone
```

### 3. Drone giao hàng
```
drone-management.html → Chọn drone → Tạo delivery → Theo dõi giao hàng
```

### Status Flow
```
PAID → ACCEPT → IN_DELIVERY → DELIVERED
```

---

## 🗂️ Cấu Trúc Project

```
foodfast/
├── src/
│   ├── main/
│   │   ├── java/com/cnpm/foodfast/
│   │   │   ├── Order/          # Order management
│   │   │   ├── Payment/        # VNPay integration
│   │   │   ├── Delivery/       # Delivery system
│   │   │   ├── Drone/          # Drone management
│   │   │   ├── Store/          # Store management
│   │   │   └── User/           # User authentication
│   │   └── resources/
│   │       ├── application.yaml
│   │       └── static/         # Frontend files
│   │           ├── index.html
│   │           ├── cart.html
│   │           ├── orders.html
│   │           ├── store-management.html ⭐
│   │           ├── drone-management.html ⭐
│   │           └── js/
├── docs/                       # Documentation
├── _archived_docs/             # Old docs (archived)
└── README.md
```

---

## 🌟 Features

### Khách hàng
- ✅ Đăng ký/Đăng nhập
- ✅ Xem danh sách cửa hàng & món ăn
- ✅ Thêm vào giỏ hàng
- ✅ Thanh toán VNPay
- ✅ Xem đơn hàng
- ✅ Theo dõi giao hàng

### Cửa hàng
- ✅ Quản lý đơn hàng (store-management.html)
- ✅ Chấp nhận/Từ chối đơn
- ✅ Cập nhật trạng thái
- ✅ Giao cho drone
- ✅ Dashboard thống kê

### Drone
- ✅ Quản lý drone (drone-management.html)
- ✅ Gán drone cho đơn hàng
- ✅ Theo dõi delivery
- ✅ Timeline tracking

---

## 🧪 Testing

### Test Data

**Default Users:**
- Username: `danh11` / Password: `123456`

**VNPay Sandbox:**
- Bank: NCB
- Card: `9704198526191432198`
- Name: `NGUYEN VAN A`
- Date: `07/15`
- OTP: `123456`

### Test Flow

1. **Login:** http://localhost:8080/home
2. **Đặt hàng:** Chọn món → Giỏ hàng → Thanh toán
3. **Quản lý (Store):** http://localhost:8080/home/store-management.html
4. **Giao hàng (Drone):** http://localhost:8080/home/drone-management.html

### Postman
Import collections trong thư mục gốc và test APIs.

---

## 🛠️ Tech Stack

### Backend
- Java 17
- Spring Boot 3.2
- Spring Security + JWT
- MySQL 8.0
- Maven

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome icons
- Responsive design

### Payment
- VNPay Sandbox Integration

### Delivery
- Custom drone management system
- Real-time tracking (planned)

---

## 📝 Configuration

### application.yaml

```yaml
server:
  port: 8080
  servlet:
    context-path: /home

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/foodfast
    username: root
    password: your_password
```

### VNPay Config

```java
vnpay.tmnCode=YOUR_TMN_CODE
vnpay.hashSecret=YOUR_HASH_SECRET
vnpay.url=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

---

## 🐛 Troubleshooting

### Lỗi thường gặp

**1. Không thấy đơn hàng trong store-management**
- Check: User đã login chưa?
- Check: Store có đơn hàng không?
- Solution: Xem `_archived_docs/FIX_STORE_ORDERS_NOT_SHOWING.md`

**2. Bị logout sau VNPay**
- Check: URL có phải ngrok không?
- Solution: System tự động redirect về localhost

**3. Drone không khả dụng**
- Check: Database có drones với status AVAILABLE không?
- Solution: Run `insert-test-data.bat`

---

## 📂 Archived Documentation

Các tài liệu cũ đã được di chuyển vào `_archived_docs/` để giữ project gọn gàng.

Nếu cần xem lại history fixes, check folder đó.

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📧 Contact

- **Project:** FoodFast Drone Delivery
- **Team:** CNPM - HKI 4
- **Year:** 2025

---

## 📜 License

This project is for educational purposes.

---

## 🎉 Status

✅ **Hoàn thành**
- Backend APIs: Complete
- Frontend UI: Complete
- Store Management: Complete
- Drone Management: Complete
- Payment Integration: Complete
- Documentation: Up-to-date

🚀 **Ready for demo!**

---

**Last Updated:** November 4, 2025

