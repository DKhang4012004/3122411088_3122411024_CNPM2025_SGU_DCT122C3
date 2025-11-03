- **Đang chuẩn bị**: Cửa hàng đang chuẩn bị món
- **Đang giao**: Đơn hàng đang được giao
- **Đã giao**: Đã giao thành công
- **Đã hủy**: Đơn hàng bị hủy

#### Xem Chi Tiết Đơn Hàng
1. Click nút **"Xem chi tiết"** trên đơn hàng
2. Modal hiển thị đầy đủ thông tin:
   - Thông tin đơn hàng
   - Địa chỉ giao hàng
   - Danh sách sản phẩm
   - Chi tiết giá
   - Ghi chú (nếu có)

#### Thanh Toán Đơn Hàng Chưa Thanh Toán
1. Tìm đơn hàng có trạng thái "Chờ xác nhận"
2. Click nút **"Thanh toán"**
3. Hệ thống chuyển đến trang VNPay
4. Hoàn tất thanh toán

## Tính Năng Nâng Cao

### 1. Badge Giỏ Hàng Động
- Badge hiển thị tổng số lượng món trong giỏ
- Tự động cập nhật khi thêm/xóa/cập nhật món
- Hiển thị trên tất cả các trang

### 2. Thông Báo (Notifications)
- Thông báo xuất hiện ở góc phải màn hình
- Tự động biến mất sau 3 giây
- Màu sắc theo loại:
  - Xanh lá: Thành công
  - Đỏ: Lỗi
  - Xanh dương: Thông tin

### 3. Skeleton Loading
- Hiển thị placeholder khi đang tải dữ liệu
- Cải thiện trải nghiệm người dùng
- Animation mượt mà

### 4. Responsive Design
- Tương thích với mọi kích thước màn hình
- Mobile-friendly
- Tự động điều chỉnh layout

### 5. LocalStorage
- Lưu token xác thực
- Lưu thông tin người dùng
- Tự động đăng nhập lại khi mở lại trang

## API Endpoints

Ứng dụng sử dụng các API sau:

### Authentication
- `POST /auth/login` - Đăng nhập
- `POST /auth/signup` - Đăng ký
- `POST /auth/logout` - Đăng xuất

### Products
- `GET /products` - Lấy danh sách sản phẩm
- `GET /products/{id}` - Lấy chi tiết sản phẩm

### Categories
- `GET /categories` - Lấy danh sách danh mục

### Cart
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/cart/add` - Thêm món vào giỏ
- `PUT /api/cart/products/{productId}` - Cập nhật số lượng
- `DELETE /api/cart/products/{productId}` - Xóa món
- `DELETE /api/cart/clear` - Xóa toàn bộ giỏ

### Orders
- `POST /api/v1/orders` - Tạo đơn hàng
- `GET /api/v1/orders/{orderId}` - Lấy chi tiết đơn
- `GET /api/v1/orders/user/{userId}` - Lấy đơn hàng của user

### Payment
- `POST /api/v1/payments/init` - Khởi tạo thanh toán
- `GET /api/v1/payments/vnpay-return` - VNPay callback

### Store
- `GET /api/stores/by-product/{productId}` - Lấy cửa hàng theo sản phẩm
- `GET /api/stores/{storeId}/products` - Lấy cửa hàng và sản phẩm

## Xử Lý Lỗi Thường Gặp

### 1. Không Kết Nối Được Backend
**Lỗi:** `Failed to fetch` hoặc `Network Error`

**Giải pháp:**
- Kiểm tra backend đã chạy chưa
- Kiểm tra URL trong `js/config.js`
- Kiểm tra CORS đã được cấu hình đúng ở backend

### 2. Lỗi 401 Unauthorized
**Lỗi:** Không thể truy cập API

**Giải pháp:**
- Đăng xuất và đăng nhập lại
- Xóa localStorage và đăng nhập lại
- Kiểm tra token có hợp lệ không

### 3. Không Thêm Được Vào Giỏ
**Lỗi:** Món từ cửa hàng khác

**Giải pháp:**
- Chỉ có thể đặt món từ 1 cửa hàng
- Xóa giỏ hàng cũ hoặc đặt món từ cùng cửa hàng

### 4. Thanh Toán Không Thành Công
**Lỗi:** Payment URL không hợp lệ

**Giải pháp:**
- Kiểm tra Ngrok đã chạy chưa
- Kiểm tra return URL trong config
- Xem log backend để biết chi tiết

## Tùy Chỉnh Giao Diện

### Thay Đổi Màu Sắc
Mở file `css/style.css` và sửa các biến CSS:

```css
:root {
    --primary-color: #ff6b35;      /* Màu chính */
    --secondary-color: #f7931e;     /* Màu phụ */
    --dark-color: #2d3436;          /* Màu tối */
    --light-color: #f8f9fa;         /* Màu sáng */
    --success-color: #00b894;       /* Màu thành công */
    --danger-color: #d63031;        /* Màu nguy hiểm */
}
```

### Thay Đổi Logo
1. Mở file HTML cần sửa
2. Tìm phần logo trong header:
```html
<div class="logo">
    <i class="fas fa-utensils"></i>
    <span>FoodFast</span>
</div>
```
3. Thay đổi icon hoặc text

### Thêm Icon FontAwesome
Tất cả icon sử dụng FontAwesome 6.0. Xem thêm tại: https://fontawesome.com/icons

## Best Practices

### 1. Bảo Mật
- Token được lưu trong localStorage
- Tự động gửi token trong header Authorization
- Tự động redirect về trang chủ nếu chưa đăng nhập

### 2. Performance
- Lazy loading cho hình ảnh
- Minimize API calls
- Cache dữ liệu trong memory khi có thể

### 3. UX/UI
- Loading states cho mọi action
- Error handling rõ ràng
- Feedback ngay lập tức cho người dùng

## Phát Triển Thêm

### Tính Năng Có Thể Thêm
1. **Tìm kiếm nâng cao**: Lọc theo giá, danh mục
2. **Yêu thích**: Lưu món ăn yêu thích
3. **Đánh giá**: Đánh giá món ăn và cửa hàng
4. **Lịch sử**: Xem lịch sử đặt hàng
5. **Địa chỉ**: Lưu nhiều địa chỉ giao hàng
6. **Voucher**: Áp dụng mã giảm giá
7. **Chat**: Chat với cửa hàng
8. **Tracking**: Theo dõi đơn hàng realtime

## Liên Hệ và Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console của trình duyệt (F12)
2. Kiểm tra log của backend
3. Đọc lại hướng dẫn
4. Liên hệ team phát triển

---

**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 31/10/2025  
**Người viết:** GitHub Copilot
# Hướng Dẫn Sử Dụng Frontend - FoodFast

## Tổng Quan

FoodFast là ứng dụng giao đồ ăn nhanh được xây dựng bằng HTML, CSS và JavaScript thuần. Ứng dụng kết nối với backend Spring Boot để cung cấp đầy đủ chức năng đặt món, thanh toán và quản lý đơn hàng.

## Cấu Trúc Thư Mục

```
Frontend/
├── index.html          # Trang chủ
├── cart.html           # Trang giỏ hàng
├── stores.html         # Trang chi tiết cửa hàng
├── orders.html         # Trang quản lý đơn hàng
├── css/
│   └── style.css       # File CSS chính
└── js/
    ├── config.js       # Cấu hình API
    ├── api.js          # Service gọi API
    ├── auth.js         # Quản lý xác thực
    ├── main.js         # Logic trang chủ
    ├── cart.js         # Logic giỏ hàng
    ├── store.js        # Logic cửa hàng
    └── orders.js       # Logic đơn hàng
```

## Cài Đặt và Chạy

### 1. Yêu Cầu Hệ Thống
- Backend Spring Boot đã chạy (port 8080)
- Trình duyệt web hiện đại (Chrome, Firefox, Edge, Safari)
- (Không cần cài đặt thêm package)

### 2. Cấu Hình API

Mở file `js/config.js` và kiểm tra cấu hình:

```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/home',  // URL backend của bạn
    ENDPOINTS: {
        // Các endpoint API
    }
};
```

**Lưu ý:** Nếu backend chạy trên port khác hoặc domain khác, hãy thay đổi `BASE_URL`.

### 3. Chạy Ứng Dụng

#### Cách 1: Mở trực tiếp file HTML
1. Mở file `index.html` bằng trình duyệt
2. Hoặc double-click vào file `index.html`

#### Cách 2: Sử dụng Live Server (Khuyên dùng)
1. Cài đặt extension "Live Server" trong VS Code
2. Click chuột phải vào `index.html` → "Open with Live Server"
3. Ứng dụng sẽ chạy tại `http://localhost:5500`

#### Cách 3: Sử dụng Python HTTP Server
```bash
cd Frontend
python -m http.server 8000
```
Truy cập: `http://localhost:8000`

## Hướng Dẫn Sử Dụng Từng Tính Năng

### 1. Đăng Ký và Đăng Nhập

#### Đăng Ký Tài Khoản Mới
1. Click nút **"Đăng ký"** ở góc phải header
2. Điền thông tin:
   - Tên đăng nhập (bắt buộc)
   - Email (bắt buộc)
   - Số điện thoại (bắt buộc)
   - Họ và tên (bắt buộc)
   - Mật khẩu (bắt buộc)
3. Click **"Đăng ký"**
4. Sau khi đăng ký thành công, modal sẽ tự động chuyển sang form đăng nhập

#### Đăng Nhập
1. Click nút **"Đăng nhập"** ở góc phải header
2. Nhập tên đăng nhập và mật khẩu
3. Click **"Đăng nhập"**
4. Sau khi đăng nhập thành công, trang sẽ reload và hiển thị tên người dùng

#### Đăng Xuất
1. Click vào avatar/tên người dùng ở góc phải
2. Click **"Đăng xuất"** trong menu dropdown

### 2. Trang Chủ (index.html)

#### Xem Danh Mục
- Danh mục sản phẩm hiển thị ngay dưới banner
- Click vào danh mục để lọc sản phẩm (chức năng sẽ được phát triển)

#### Tìm Kiếm Món Ăn
1. Nhập tên món ăn vào ô tìm kiếm
2. Click nút **"Tìm kiếm"** hoặc nhấn Enter
3. Kết quả sẽ hiển thị dưới dạng lưới sản phẩm

#### Xem Món Ăn
- Các món ăn hiển thị dưới dạng card với:
  - Hình ảnh món ăn
  - Tên món
  - Mô tả ngắn
  - Giá
  - Số lượng còn lại
  - Nút thêm vào giỏ hàng

#### Thêm Món Vào Giỏ (Nhanh)
1. Click nút giỏ hàng (icon) trên card sản phẩm
2. Món sẽ được thêm với số lượng 1
3. Badge giỏ hàng sẽ cập nhật số lượng

#### Xem Chi Tiết Cửa Hàng
1. Click vào bất kỳ đâu trên card sản phẩm (không phải nút giỏ hàng)
2. Trang sẽ chuyển đến trang cửa hàng với đầy đủ món ăn

### 3. Trang Cửa Hàng (stores.html)

#### Xem Thông Tin Cửa Hàng
- Tên cửa hàng
- Mô tả
- Địa chỉ
- Số lượng món
- Trạng thái (Đang mở/Đã đóng)

#### Xem Tất Cả Món Của Cửa Hàng
- Tất cả món ăn của cửa hàng hiển thị dưới phần thông tin
- Mỗi món hiển thị đầy đủ thông tin và giá

#### Thêm Món Vào Giỏ Hàng
1. Click nút **"Thêm"** trên món ăn muốn đặt
2. Hệ thống sẽ thêm món với số lượng 1
3. Thông báo xác nhận xuất hiện
4. Badge giỏ hàng cập nhật

**Lưu ý:** 
- Phải đăng nhập mới có thể thêm vào giỏ hàng
- Chỉ có thể thêm món còn hàng
- Tất cả món trong giỏ phải từ cùng một cửa hàng

### 4. Trang Giỏ Hàng (cart.html)

#### Xem Giỏ Hàng
- Hiển thị tất cả món đã thêm
- Mỗi món hiển thị:
  - Tên món
  - Giá đơn vị
  - Số lượng
  - Tổng giá

#### Cập Nhật Số Lượng
1. Click nút **+** để tăng số lượng
2. Click nút **-** để giảm số lượng
3. Giỏ hàng tự động cập nhật tổng tiền

**Lưu ý:**
- Nếu món đã có trong giỏ, thêm lại sẽ tăng số lượng (không tạo item mới)
- Số lượng tối thiểu là 1

#### Xóa Món Khỏi Giỏ
1. Click nút **"Xóa"** bên cạnh món muốn xóa
2. Xác nhận xóa
3. Món sẽ bị xóa khỏi giỏ hàng

#### Xem Tóm Tắt Đơn Hàng
Bên phải giỏ hàng hiển thị:
- Tạm tính (tổng giá món ăn)
- Phí giao hàng (15,000đ cố định)
- Tổng cộng

#### Thanh Toán
1. Click nút **"Tiến hành thanh toán"**
2. Điền thông tin giao hàng:
   - Địa chỉ chi tiết
   - Thành phố
   - Quận/Huyện
   - Số điện thoại
   - Ghi chú (tùy chọn)
3. Chọn phương thức thanh toán:
   - **VNPay**: Thanh toán qua cổng VNPay
   - **Tiền mặt**: Thanh toán khi nhận hàng (COD)
4. Click **"Đặt hàng"**

#### Thanh Toán VNPay
1. Sau khi đặt hàng, hệ thống tự động chuyển đến trang VNPay
2. Quét mã QR hoặc nhập thông tin thẻ
3. Xác nhận thanh toán
4. Sau khi thanh toán thành công, bạn sẽ được chuyển về trang đơn hàng

### 5. Trang Đơn Hàng (orders.html)

#### Xem Danh Sách Đơn Hàng
- Hiển thị tất cả đơn hàng của bạn
- Sắp xếp từ mới nhất đến cũ nhất
- Mỗi đơn hiển thị:
  - Mã đơn hàng
  - Trạng thái
  - Danh sách món
  - Tổng tiền
  - Thời gian đặt

#### Trạng Thái Đơn Hàng
- **Chờ xác nhận**: Đơn mới tạo, chưa thanh toán
- **Đã xác nhận**: Cửa hàng đã xác nhận

