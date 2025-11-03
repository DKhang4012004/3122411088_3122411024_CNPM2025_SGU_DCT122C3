curl -X POST http://localhost:8080/home/api/v1/ledger/store/1/payout
```

## MÔ HÌNH MARKETPLACE

```
┌─────────────┐
│   USER      │
│ (Khách hàng)│
└──────┬──────┘
       │ Thanh toán 100,000đ
       ▼
┌─────────────────────────────┐
│   MERCHANT BACKEND (App)    │
│  ┌──────────────────────┐   │
│  │ PaymentTransaction   │   │
│  │ StoreLedger          │   │
│  │ PayoutBatch          │   │
│  └──────────────────────┘   │
└──────┬──────────────────────┘
       │
       ├─► VNPay (Payment Gateway) - Phí 1%
       │
       └─► Cửa hàng nhận: 79,000đ
           (100,000 - 20% hoa hồng - 1% phí gateway)
```

## NOTES

1. **Webhook URL**: Cần cấu hình webhook URL trên VNPay merchant portal
2. **Return URL**: URL user sẽ được redirect sau khi thanh toán
3. **Testing**: Sử dụng VNPay sandbox để test
4. **Production**: Cần thay đổi tmn-code, hash-secret, và URLs thành môi trường production

## SUPPORT

Để được hỗ trợ về VNPay integration:
- Docs: https://sandbox.vnpayment.vn/apis/docs/
- Support: support@vnpay.vn
# HỆ THỐNG THANH TOÁN - DRONE DELIVERY MARKETPLACE

## TỔNG QUAN HỆ THỐNG

Hệ thống thanh toán hoàn chỉnh theo mô hình Marketplace với các tính năng:
- ✅ Tạo đơn hàng và khởi tạo thanh toán
- ✅ Tích hợp VNPay payment gateway
- ✅ Xử lý webhook từ VNPay
- ✅ Quản lý công nợ cho cửa hàng (Store Ledger)
- ✅ Thanh toán cho cửa hàng (Payout Batch)
- ✅ Tự động tính phí hoa hồng và phí cổng thanh toán

## CẤU TRÚC DATABASE

### 1. payment_transaction
- Lưu thông tin giao dịch thanh toán
- Trạng thái: INIT, PENDING, SUCCESS, FAILED, CANCELLED
- Provider: VNPAY, MOMO
- Method: WALLET, QR, CARD

### 2. store_ledger
- Sổ cái ghi nhận doanh thu cho mỗi đơn hàng
- Tự động tính toán:
  - total_order_amount: Tổng tiền đơn hàng
  - app_commission_amount: Phí hoa hồng app (20%)
  - payment_gateway_fee: Phí cổng thanh toán (1%)
  - net_amount_owed: Tiền thực nhận của cửa hàng
- Trạng thái: UNPAID, PROCESSING, PAID

### 3. payout_batch
- Quản lý các đợt thanh toán cho cửa hàng
- Trạng thái: PENDING, PROCESSING, PAID, FAILED

## LUỒNG NGHIỆP VỤ

### A. LUỒNG ĐẶT HÀNG VÀ THANH TOÁN (User)

```
1. Tạo đơn hàng
POST /home/api/v1/orders
{
  "userId": 1,
  "storeId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}

Response:
{
  "code": 200,
  "message": "Order created successfully",
  "result": {
    "id": 1,
    "orderCode": "ORD1730361234567ABC12345",
    "status": "CREATED",
    "paymentStatus": "PENDING",
    "totalPayable": 120000
  }
}

2. Khởi tạo thanh toán
POST /home/api/v1/payments/init
{
  "orderId": 1,
  "provider": "VNPAY",
  "method": "QR"
}

Response:
{
  "code": 200,
  "message": "Payment initialized successfully",
  "result": {
    "id": 1,
    "orderId": 1,
    "provider": "VNPAY",
    "amount": 120000,
    "currency": "VND",
    "status": "INIT",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
    }
}

3. User quét QR hoặc truy cập paymentUrl để thanh toán

4. VNPay gửi webhook về server (tự động)
POST /home/api/v1/payments/vnpay-webhook
(VNPay sẽ gọi API này tự động)

5. Hệ thống tự động:
   - Cập nhật trạng thái giao dịch
   - Cập nhật trạng thái đơn hàng -> PAID
   - Tạo bản ghi StoreLedger (công nợ cho cửa hàng)
```

### B. LUỒNG QUẢN LÝ CÔNG NỢ VÀ THANH TOÁN CHO CỬA HÀNG (Admin)

```
1. Xem số tiền chưa thanh toán cho cửa hàng
GET /home/api/v1/ledger/store/{storeId}/unpaid-amount

Response:
{
  "code": 200,
  "result": 5600000  // VND
}

2. Tạo lô thanh toán cho cửa hàng
POST /home/api/v1/ledger/store/{storeId}/payout

Response:
{
  "code": 200,
  "message": "Payout batch created successfully",
  "result": {
    "id": 1,
    "storeId": 1,
    "totalPayoutAmount": 5600000,
    "status": "PENDING",
    "notes": "Payout for 25 orders",
    "createdAt": "2025-10-31T10:30:00"
  }
}

3. Đánh dấu đã thanh toán (sau khi chuyển khoản thành công)
POST /home/api/v1/ledger/payout/{payoutBatchId}/mark-paid?transactionCode=BANK123456

Response:
{
  "code": 200,
  "message": "Payout batch marked as paid successfully"
}

4. Xem lịch sử thanh toán của cửa hàng
GET /home/api/v1/ledger/store/{storeId}/payouts

Response:
{
  "code": 200,
  "result": [
    {
      "id": 1,
      "storeId": 1,
      "totalPayoutAmount": 5600000,
      "status": "PAID",
      "transactionCode": "BANK123456",
      "processedAt": "2025-10-31T14:00:00"
    }
  ]
}
```

## API ENDPOINTS SUMMARY

### Order APIs
- `POST /home/api/v1/orders` - Tạo đơn hàng mới
- `GET /home/api/v1/orders/{orderId}` - Xem chi tiết đơn hàng
- `GET /home/api/v1/orders/code/{orderCode}` - Xem đơn hàng theo mã
- `GET /home/api/v1/orders/user/{userId}` - Xem đơn hàng của user
- `GET /home/api/v1/orders/store/{storeId}` - Xem đơn hàng của cửa hàng
- `POST /home/api/v1/orders/{orderId}/cancel` - Hủy đơn hàng

### Payment APIs
- `POST /home/api/v1/payments/init` - Khởi tạo thanh toán
- `POST /home/api/v1/payments/vnpay-webhook` - Webhook từ VNPay (tự động)
- `GET /home/api/v1/payments/vnpay-return` - Return URL sau khi thanh toán
- `GET /home/api/v1/payments/order/{orderId}` - Xem thông tin thanh toán

### Ledger APIs (Admin)
- `GET /home/api/v1/ledger/store/{storeId}/unpaid-amount` - Xem số tiền chưa thanh toán
- `POST /home/api/v1/ledger/store/{storeId}/payout` - Tạo lô thanh toán
- `POST /home/api/v1/ledger/payout/{payoutBatchId}/mark-paid` - Đánh dấu đã thanh toán
- `GET /home/api/v1/ledger/store/{storeId}/payouts` - Xem lịch sử thanh toán

## CẤU HÌNH

### File: application.yaml

```yaml
# VNPay Configuration
vnpay:
  tmn-code: "DEMO"  # Thay bằng mã merchant thực
  hash-secret: "DEMO_SECRET"  # Thay bằng secret key thực
  url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  return-url: "http://localhost:8080/home/api/v1/payments/vnpay-return"
  api-url: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
  version: "2.1.0"
  command: "pay"
  order-type: "other"

# App Configuration
app:
  commission:
    rate: 0.20  # 20% hoa hồng cho app
  payment-gateway:
    fee-rate: 0.01  # 1% phí cổng thanh toán
```

## VÍ DỤ TÍNH TOÁN PHÍ

Giả sử đơn hàng có tổng giá trị: **100,000 VND**

1. **Khách hàng thanh toán**: 100,000 VND
2. **App nhận được**: 100,000 VND (qua VNPay)
3. **Tính toán phí**:
   - Phí hoa hồng app (20%): 20,000 VND
   - Phí cổng thanh toán (1%): 1,000 VND
   - **Cửa hàng nhận**: 100,000 - 20,000 - 1,000 = **79,000 VND**

## SECURITY

1. **VNPay Signature Verification**: Xác thực chữ ký từ VNPay webhook
2. **HMAC SHA512**: Mã hóa dữ liệu giao dịch
3. **Transaction Validation**: Kiểm tra trạng thái và mã phản hồi từ VNPay

## TESTING GUIDE

### 1. Test tạo đơn hàng
```bash
curl -X POST http://localhost:8080/home/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "storeId": 1,
    "items": [
      {"productId": 1, "quantity": 2}
    ]
  }'
```

### 2. Test khởi tạo thanh toán
```bash
curl -X POST http://localhost:8080/home/api/v1/payments/init \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "provider": "VNPAY",
    "method": "QR"
  }'
```

### 3. Test xem công nợ
```bash
curl http://localhost:8080/home/api/v1/ledger/store/1/unpaid-amount
```

### 4. Test tạo lô thanh toán
```bash

