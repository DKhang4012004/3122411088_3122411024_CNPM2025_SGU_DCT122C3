# 📘 Hướng dẫn tích hợp VNPay - FoodFast Payment System

## 🎯 Tổng quan

Hệ thống thanh toán FoodFast tích hợp với VNPay sandbox để xử lý thanh toán trực tuyến. Hệ thống bao gồm 3 endpoint chính:

1. **Payment Init** - Khởi tạo giao dịch thanh toán
2. **IPN URL** (Instant Payment Notification) - Nhận thông báo từ VNPay (server-to-server)
3. **Return URL** - Hiển thị kết quả cho khách hàng (browser redirect)

---

## 🔄 Luồng thanh toán

```
1. Khách hàng → POST /api/v1/payments/init
   ↓
2. Server tạo payment URL và redirect khách hàng đến VNPay
   ↓
3. Khách hàng thanh toán tại VNPay
   ↓
4. VNPay gọi IPN URL (GET /api/v1/payments/vnpay-ipn) → Cập nhật database
   ↓
5. VNPay redirect khách hàng về Return URL (GET /api/v1/payments/vnpay-return) → Hiển thị kết quả
```

---

## 📍 API Endpoints

### 1. Initialize Payment

**Endpoint:** `POST /home/api/v1/payments/init`

**Request Body:**
```json
{
  "orderId": 2,
  "provider": "VNPAY",
  "method": "QR"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Payment initialized successfully",
  "result": {
    "id": 5,
    "orderId": 2,
    "provider": "VNPAY",
    "amount": 120000.00,
    "currency": "VND",
    "status": "INIT",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "createdAt": "2025-10-31T17:08:26.578361"
  }
}
```

**Cách sử dụng:**
- Client gọi API này để khởi tạo thanh toán
- Server trả về `paymentUrl`
- Client redirect khách hàng đến `paymentUrl` để thanh toán

---

### 2. IPN URL (Server-to-Server Callback)

**Endpoint:** `GET /home/api/v1/payments/vnpay-ipn`

**Purpose:** VNPay gọi endpoint này để thông báo kết quả thanh toán. Endpoint này sẽ cập nhật database.

**Query Parameters:** (Tự động gửi từ VNPay)
```
vnp_TmnCode=DEMO
vnp_Amount=12000000
vnp_BankCode=NCB
vnp_TransactionNo=14226112
vnp_ResponseCode=00
vnp_TransactionStatus=00
vnp_TxnRef=ORD1761898858048D4E4EFDB
vnp_SecureHash=...
```

**Response:**
```json
{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```

**Response Codes:**
- `00` - Confirm Success (Đã cập nhật thành công)
- `01` - Order not Found
- `02` - Order already confirmed
- `04` - Invalid Amount
- `97` - Invalid Checksum
- `99` - Unknown error

**Xử lý:**
1. ✅ Kiểm tra checksum (vnp_SecureHash)
2. ✅ Tìm order trong database (vnp_TxnRef)
3. ✅ Kiểm tra trạng thái order (chưa thanh toán)
4. ✅ Kiểm tra số tiền (vnp_Amount)
5. ✅ Cập nhật database:
   - PaymentTransaction status → SUCCESS/FAILED
   - Order status → PAID/CREATED
   - Tạo StoreLedger entry (nếu thành công)

**Retry Mechanism:**
- VNPay sẽ retry tối đa 10 lần nếu nhận response code: 01, 04, 97, 99
- Khoảng cách giữa các lần retry: 5 phút
- Dừng retry khi nhận code: 00, 02

---

### 3. Return URL (Browser Redirect)

**Endpoint:** `GET /home/api/v1/payments/vnpay-return`

**Purpose:** VNPay redirect khách hàng về endpoint này sau khi thanh toán. Endpoint này CHỈ hiển thị kết quả, KHÔNG cập nhật database.

**Query Parameters:** (Giống IPN URL)

**Response:** HTML page hiển thị kết quả thanh toán

**Các trường hợp:**
1. ✅ **Thanh toán thành công** (vnp_ResponseCode=00)
   - Hiển thị trang success với thông tin giao dịch
   - Button "Xem đơn hàng"

2. ❌ **Thanh toán thất bại** (vnp_ResponseCode≠00)
   - Hiển thị trang error với mã lỗi và lý do
   - Button "Thử lại" và "Quay về trang chủ"

3. ⚠️ **Chữ ký không hợp lệ**
   - Hiển thị cảnh báo bảo mật
   - Button "Quay về trang chủ"

---

## 🔐 Security - Checksum Verification

### Cách VNPay tạo checksum:

1. Sắp xếp tất cả parameters theo thứ tự alphabet (TreeMap)
2. Loại bỏ `vnp_SecureHash` và `vnp_SecureHashType`
3. Nối các parameters: `key1=value1&key2=value2&...`
4. Hash bằng HMAC SHA512 với secret key

### Code kiểm tra checksum:

```java
@Override
public boolean verifyVnPaySignature(VnPayWebhookPayload payload) {
    String receivedHash = payload.getVnp_SecureHash();
    
    Map<String, String> params = new TreeMap<>();
    params.put("vnp_TmnCode", payload.getVnp_TmnCode());
    params.put("vnp_Amount", payload.getVnp_Amount());
    // ... add all parameters except vnp_SecureHash
    
    StringBuilder hashData = new StringBuilder();
    for (Map.Entry<String, String> entry : params.entrySet()) {
        if (entry.getValue() != null && !entry.getValue().isEmpty()) {
            if (hashData.length() > 0) hashData.append("&");
            hashData.append(entry.getKey()).append("=").append(entry.getValue());
        }
    }
    
    String calculatedHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
    return calculatedHash.equalsIgnoreCase(receivedHash);
}
```

---

## 📊 Mã lỗi VNPay

### vnp_TransactionStatus

| Code | Mô tả |
|------|-------|
| 00 | Giao dịch thành công |
| 01 | Giao dịch chưa hoàn tất |
| 02 | Giao dịch bị lỗi |
| 04 | Giao dịch đảo (Khách hàng đã bị trừ tiền tại Ngân hàng nhưng GD chưa thành công ở VNPAY) |
| 07 | Giao dịch bị nghi ngờ gian lận |
| 09 | GD Hoàn trả bị từ chối |

### vnp_ResponseCode

| Code | Mô tả |
|------|-------|
| 00 | Giao dịch thành công |
| 07 | Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường) |
| 09 | Thẻ/Tài khoản chưa đăng ký InternetBanking |
| 10 | Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần |
| 11 | Đã hết hạn chờ thanh toán |
| 12 | Thẻ/Tài khoản bị khóa |
| 13 | Nhập sai mật khẩu OTP |
| 24 | Khách hàng hủy giao dịch |
| 51 | Tài khoản không đủ số dư |
| 65 | Tài khoản vượt quá hạn mức giao dịch trong ngày |
| 75 | Ngân hàng thanh toán đang bảo trì |
| 79 | Nhập sai mật khẩu thanh toán quá số lần quy định |
| 99 | Các lỗi khác |

---

## 🔧 Cấu hình

### application.yaml

```yaml
vnpay:
  tmn-code: "D1GOXCFX"
  hash-secret: "FMX97DS9752G5SWI40ZPBO3R2EQMQ9H5"
  url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  return-url: "http://localhost:8080/home/api/v1/payments/vnpay-return"
  api-url: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
  version: "2.1.0"
  command: "pay"
  order-type: "other"
```

**Thông tin credentials:**
- ✅ `tmn-code`: **D1GOXCFX** - Terminal ID / Mã Website
- ✅ `hash-secret`: **FMX97DS9752G5SWI40ZPBO3R2EQMQ9H5** - Secret Key để tạo checksum
- ✅ `url`: **https://sandbox.vnpayment.vn/paymentv2/vpcpay.html** - Payment Gateway URL
- ✅ `api-url`: API URL để query thông tin giao dịch (không dùng để thanh toán)
- ✅ Return URL sẽ tự động được thay thế bằng Ngrok URL khi chạy local

**QUAN TRỌNG:** Không nhầm lẫn giữa 2 URL:
- Payment URL: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` ← Dùng để khởi tạo thanh toán
- API URL: `https://sandbox.vnpayment.vn/merchant_webapi/api/transaction` ← Dùng để query giao dịch

**🔐 Bảo mật:**
- ⚠️ **KHÔNG** commit hash-secret vào Git trong production
- ⚠️ Sử dụng environment variables cho production
- ✅ Credentials hiện tại là cho **SANDBOX** testing

---

## 🧪 Testing với Ngrok

### Bước 1: Khởi động Ngrok

```bash
ngrok http 8080
```

### Bước 2: Kiểm tra Ngrok status

```bash
GET http://localhost:8080/home/api/v1/ngrok/status
```

Response:
```json
{
  "code": 200,
  "message": "Ngrok is running",
  "result": {
    "currentUrl": "https://shieldless-pamula-adhesively.ngrok-free.dev",
    "ngrokWebInterface": "http://localhost:4040",
    "isNgrokRunning": true
  }
}
```

### Bước 3: Test thanh toán

```bash
POST http://localhost:8080/home/api/v1/payments/init
Content-Type: application/json

{
  "orderId": 2,
  "provider": "VNPAY",
  "method": "QR"
}
```

### Bước 4: Sử dụng payment URL

- Copy `paymentUrl` từ response
- Mở trong browser
- Thực hiện thanh toán tại VNPay sandbox
- Sau khi thanh toán, bạn sẽ được redirect về Return URL

---

## 🎨 UI Screenshots

### Success Page
- ✅ Icon màu xanh với dấu tick
- Hiển thị mã đơn hàng, số tiền, mã giao dịch, thời gian
- Button "Xem đơn hàng"
- Animation mượt mà

### Failure Page
- ❌ Icon màu đỏ với dấu X
- Hiển thị mã lỗi và lý do cụ thể
- Gợi ý hành động tiếp theo
- Button "Thử lại" và "Quay về trang chủ"

### Invalid Signature Page
- ⚠️ Icon cảnh báo màu cam
- Thông báo lỗi bảo mật
- Button "Quay về trang chủ"

---

## 🗄️ Database Schema

### payment_transaction

```sql
CREATE TABLE payment_transaction (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  method VARCHAR(50),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'VND',
  status ENUM('INIT', 'PENDING', 'SUCCESS', 'FAILED') NOT NULL,
  provider_transaction_id VARCHAR(100),
  request_payload TEXT,
  response_payload TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### store_ledger

```sql
CREATE TABLE store_ledger (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  total_order_amount DECIMAL(15,2) NOT NULL,
  app_commission_amount DECIMAL(15,2) NOT NULL,
  payment_gateway_fee DECIMAL(15,2) NOT NULL,
  net_amount_owed DECIMAL(15,2) NOT NULL,
  status ENUM('UNPAID','PROCESSING','PAID') DEFAULT 'UNPAID',
  payout_batch_id BIGINT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_restaurant_ledger_order (order_id),
  FOREIGN KEY (store_id) REFERENCES store(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

## 🐛 Troubleshooting

### Vấn đề 1: Return URL trả về lỗi 404
**Nguyên nhân:** Ngrok URL không được cập nhật trong payment request

**Giải pháp:**
1. Kiểm tra Ngrok đang chạy: `GET /api/v1/ngrok/status`
2. Restart application để refresh Ngrok URL
3. Kiểm tra logs: `Using return URL: https://...`

### Vấn đề 2: IPN không được gọi
**Nguyên nhân:** VNPay sandbox có thể không gọi IPN trong môi trường test

**Giải pháp:**
- Sử dụng Return URL để test flow
- Trong production, VNPay sẽ gọi IPN URL

### Vấn đề 3: Checksum không hợp lệ
**Nguyên nhân:** 
- Hash secret không đúng
- Parameters không được sắp xếp đúng thứ tự
- Có parameters null/empty không được filter

**Giải pháp:**
- Kiểm tra hash secret trong application.yaml
- Debug: In ra hashData trước khi hash
- So sánh với hash từ VNPay

---

## 📝 Best Practices

### 1. Idempotency
✅ Kiểm tra order đã thanh toán chưa trước khi xử lý
```java
if (transaction.getStatus() == PaymentTransactionStatus.SUCCESS) {
    return "02"; // Order already confirmed
}
```

### 2. Amount Validation
✅ Luôn kiểm tra số tiền trước khi cập nhật
```java
BigDecimal expectedAmount = order.getTotalPayable().multiply(new BigDecimal(100));
BigDecimal receivedAmount = new BigDecimal(vnpAmount);

if (receivedAmount.compareTo(expectedAmount) != 0) {
    return "04"; // Invalid Amount
}
```

### 3. Transaction Management
✅ Sử dụng @Transactional để đảm bảo data consistency
```java
@Override
@Transactional
public String processVnPayIPN(VnPayWebhookPayload payload) {
    // Update payment transaction
    // Update order status
    // Create ledger entry
    // All or nothing
}
```

### 4. Logging
✅ Log đầy đủ để debug
```java
log.info("=== VNPAY IPN RECEIVED ===");
log.info("Order Code: {}, ResponseCode: {}", vnp_TxnRef, vnp_ResponseCode);
```

### 5. Error Handling
✅ Trả về response code phù hợp cho VNPay retry
- `00`, `02` → VNPay dừng retry
- `01`, `04`, `97`, `99` → VNPay retry

---

## 🚀 Production Checklist

- [ ] Thay DEMO credentials bằng production credentials
- [ ] Cấu hình SSL/HTTPS cho IPN URL và Return URL
- [ ] Setup monitoring cho payment failures
- [ ] Test retry mechanism
- [ ] Setup alerts cho invalid checksums
- [ ] Backup payment_transaction table định kỳ
- [ ] Test các mã lỗi khác nhau
- [ ] Document recovery procedures

---

## 📞 Support

- VNPay Docs: https://sandbox.vnpayment.vn/apis/docs/
- Email: support@vnpay.vn
- Hotline: 1900 55 55 77

---

**Last Updated:** November 1, 2025
**Version:** 1.0
**Author:** FoodFast Development Team
