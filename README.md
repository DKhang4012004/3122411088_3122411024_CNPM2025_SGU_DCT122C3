# FoodFast - Drone Delivery System

Hệ thống giao đồ ăn bằng drone với tích hợp thanh toán VNPay.

## 🚀 Khởi động nhanh

### 1. Yêu cầu hệ thống
- Java 17+
- MySQL 8.0+
- Maven 3.6+

### 2. Cấu hình Database
```bash
# Chạy file setup database
mysql -u root -p < demo_database_setup.sql

# Thêm dữ liệu test
insert-test-data.bat
```

### 3. Khởi động server
```bash
start-server.bat
```

Server sẽ chạy tại: `http://localhost:8080/home`

## 📚 Tài liệu

- [System Architecture](docs/SYSTEM_ARCHITECTURE.md) - **Kiến trúc hệ thống và luồng hoạt động**
- [API Testing Guide](docs/API_TESTING.md) - **Hướng dẫn test API từ đặt hàng đến nhận hàng**
- [Payment System](docs/PAYMENT_SYSTEM_GUIDE.md) - Hướng dẫn thanh toán VNPay
- [Payout System](docs/PAYOUT_SYSTEM_GUIDE.md) - Hướng dẫn hệ thống chi trả
- [VNPay Integration](docs/VNPAY_INTEGRATION_GUIDE.md) - Chi tiết tích hợp VNPay

## 🧪 Testing

### Postman Collections
- `Complete_Order_Flow_Test.postman_collection.json` - Test luồng đặt hàng đầy đủ
- `Drone_Complete_APIs.postman_collection.json` - Test API drone
- `Payment_System_Demo.postman_collection.json` - Test thanh toán
- `Payout_System_API.postman_collection.json` - Test chi trả

### Scripts hỗ trợ
```bash
test-order-flow.bat       # Test luồng đặt hàng
test-drone-flow.bat       # Test drone delivery
test-store-products.bat   # Test store và products
```

## 🏗️ Cấu trúc dự án

```
foodfast/
├── src/                    # Source code
├── Frontend/               # Frontend files
├── docs/                   # Documentation
├── *.postman_collection.json  # Postman test collections
└── *.bat                   # Batch scripts
```

## 🔧 Cấu hình

Chỉnh sửa `src/main/resources/application.yaml`:
- Database connection
- VNPay credentials
- JWT settings
- Commission rates

## 📱 Frontend

Mở `Frontend/index.html` trong browser để truy cập giao diện web.

## 🐳 Docker (Optional)

```bash
docker-compose up -d
```

## 📝 License

This project is for educational purposes.

