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
│   │           ├── store-management.html 
│   │           ├── drone-management.html 
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




