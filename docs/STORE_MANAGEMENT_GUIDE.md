# Tính năng Quản Lý Cửa Hàng (Store Management)

## Tổng quan
Tính năng quản lý cửa hàng cho phép chủ cửa hàng quản lý thông tin cửa hàng, sản phẩm và thông tin thanh toán một cách toàn diện.

## Tính năng chính

### 1. Quản lý Thông tin Cửa hàng
- **Tạo cửa hàng mới**: Chủ sở hữu có thể tạo nhiều cửa hàng
- **Cập nhật thông tin cơ bản**:
  - Tên cửa hàng
  - Mô tả
  - Email liên hệ
  - Trạng thái (ACTIVE, INACTIVE, PENDING)
- **Quản lý địa chỉ cửa hàng**:
  - Địa chỉ chi tiết
  - Tỉnh/Thành phố
  - Quận/Huyện
  - Phường/Xã
  - Tọa độ GPS (Latitude, Longitude)

### 2. Quản lý Sản phẩm
- **Xem danh sách sản phẩm**: Hiển thị tất cả sản phẩm của cửa hàng
- **Thêm sản phẩm mới**:
  - Tên sản phẩm
  - Mô tả
  - Giá
  - Danh mục
  - Hình ảnh (URL)
- **Sửa sản phẩm**: Cập nhật thông tin sản phẩm đã có
- **Xóa sản phẩm**: Xóa sản phẩm không còn kinh doanh

### 3. Quản lý Thanh toán
- **Thông tin tài khoản ngân hàng**:
  - Tên chủ tài khoản
  - Số tài khoản
  - Tên ngân hàng
  - Chi nhánh
- Hệ thống sử dụng thông tin này để thanh toán doanh thu cho cửa hàng

### 4. Thống kê (Dashboard)
- Tổng số sản phẩm
- Tổng số đơn hàng
- Đơn hàng chờ xác nhận
- Tổng doanh thu

## Cấu trúc File

### Frontend Files
```
src/main/resources/static/
├── store-management.html          # Trang quản lý cửa hàng
└── js/
    └── store-management.js        # Logic quản lý cửa hàng

Frontend/
├── store-management.html          # Bản sao cho development
└── js/
    └── store-management.js        # Bản sao cho development
```

### Backend APIs Sử dụng
```
1. Store Management APIs:
   GET    /api/stores/owner/{ownerUserId}     - Lấy danh sách cửa hàng của user
   GET    /api/stores/{storeId}               - Lấy thông tin cửa hàng
   POST   /api/stores                         - Tạo cửa hàng mới
   PUT    /api/stores/{storeId}               - Cập nhật thông tin cửa hàng
   DELETE /api/stores/{storeId}               - Xóa cửa hàng

2. Store Address APIs:
   GET    /api/store-address/store/{storeId}  - Lấy địa chỉ cửa hàng
   POST   /api/store-address                  - Tạo địa chỉ mới
   PUT    /api/store-address/{addressId}      - Cập nhật địa chỉ

3. Product Management APIs:
   GET    /api/stores/{storeId}/products      - Lấy danh sách sản phẩm
   POST   /api/stores/{storeId}/products      - Thêm sản phẩm mới
   GET    /api/products/{productId}           - Lấy thông tin sản phẩm
   PUT    /api/products/{productId}           - Cập nhật sản phẩm
   DELETE /api/products/{productId}           - Xóa sản phẩm

4. Category APIs:
   GET    /api/categories                     - Lấy danh sách danh mục
```

## Hướng dẫn Sử dụng

### 1. Truy cập trang quản lý
- URL: `http://localhost:8080/home/store-management.html`
- Yêu cầu: Phải đăng nhập trước

### 2. Tạo cửa hàng mới
1. Click nút "Tạo cửa hàng mới"
2. Điền thông tin:
   - Tên cửa hàng (bắt buộc)
   - Mô tả
   - Email liên hệ
3. Click "Tạo cửa hàng"

### 3. Quản lý thông tin cửa hàng
1. Chọn cửa hàng từ dropdown (nếu có nhiều cửa hàng)
2. Chuyển đến tab "Thông tin cửa hàng"
3. Cập nhật các thông tin cần thiết
4. Click "Lưu thay đổi"

### 4. Cập nhật địa chỉ
1. Trong tab "Thông tin cửa hàng"
2. Scroll xuống phần "Địa Chỉ Cửa Hàng"
3. Điền đầy đủ thông tin địa chỉ
4. Có thể thêm tọa độ GPS để hỗ trợ giao hàng bằng drone
5. Click "Cập nhật địa chỉ"

### 5. Quản lý sản phẩm
#### Thêm sản phẩm:
1. Chuyển đến tab "Sản phẩm"
2. Click "Thêm sản phẩm"
3. Điền thông tin sản phẩm
4. Click "Lưu sản phẩm"

#### Sửa sản phẩm:
1. Click icon "Edit" (bút) trên sản phẩm muốn sửa
2. Cập nhật thông tin
3. Click "Lưu sản phẩm"

#### Xóa sản phẩm:
1. Click icon "Trash" (thùng rác) trên sản phẩm muốn xóa
2. Xác nhận xóa

### 6. Cập nhật thông tin thanh toán
1. Chuyển đến tab "Thông tin thanh toán"
2. Điền thông tin tài khoản ngân hàng
3. Click "Cập nhật thông tin"

## UI/UX Features

### 1. Responsive Design
- Tương thích với mọi thiết bị (desktop, tablet, mobile)
- Grid layout tự động điều chỉnh theo màn hình

### 2. Tab Navigation
- 3 tabs chính: Thông tin cửa hàng, Sản phẩm, Thông tin thanh toán
- Dễ dàng chuyển đổi giữa các phần

### 3. Statistics Cards
- Hiển thị số liệu tổng quan ngay đầu trang
- Icons màu sắc phân biệt từng loại thống kê

### 4. Modal Dialogs
- Tạo cửa hàng mới
- Thêm/Sửa sản phẩm
- Tránh load lại trang, UX mượt mà

### 5. Notifications
- Hiển thị thông báo thành công/lỗi
- Tự động ẩn sau 3 giây

## Security

### 1. Authentication
- Tất cả API yêu cầu JWT token
- Auto redirect về login nếu chưa đăng nhập

### 2. Authorization
- Chỉ owner mới được quản lý cửa hàng của mình
- Backend kiểm tra ownerUserId

### 3. Data Validation
- Frontend validation trước khi submit
- Backend validation với @Valid annotation

## Kết nối với các module khác

### 1. Drone Management
- Link: `drone-management.html`
- Quản lý đơn hàng và giao hàng bằng drone
- Owner có thể xem và xác nhận đơn hàng

### 2. User Orders
- Link: `orders.html`
- Khách hàng xem đơn hàng của mình
- Liên kết với sản phẩm từ cửa hàng

### 3. Store Catalog
- Link: `stores.html`
- Hiển thị danh sách cửa hàng và sản phẩm
- Khách hàng chọn mua sản phẩm

## Testing

### Test Scenarios

1. **Tạo cửa hàng mới**
   - Tạo cửa hàng với thông tin hợp lệ
   - Kiểm tra validation khi thiếu thông tin

2. **Cập nhật thông tin**
   - Cập nhật tên, mô tả cửa hàng
   - Cập nhật địa chỉ
   - Cập nhật thông tin ngân hàng

3. **Quản lý sản phẩm**
   - Thêm sản phẩm mới
   - Sửa thông tin sản phẩm
   - Xóa sản phẩm
   - Kiểm tra hiển thị trong store catalog

4. **Multi-store**
   - User có nhiều cửa hàng
   - Chuyển đổi giữa các cửa hàng
   - Mỗi cửa hàng có sản phẩm riêng

## Future Enhancements

### 1. Image Upload
- Upload hình ảnh cửa hàng
- Upload hình ảnh sản phẩm
- Lưu trữ trên server hoặc cloud storage

### 2. Real Statistics
- Tính toán doanh thu thực tế từ đơn hàng
- Biểu đồ doanh thu theo thời gian
- Top sản phẩm bán chạy

### 3. Store Status Management
- Tự động đóng/mở cửa theo giờ
- Thông báo cho khách hàng khi cửa hàng đóng

### 4. Product Inventory
- Quản lý số lượng tồn kho
- Cảnh báo khi hết hàng
- Tự động cập nhật sau mỗi đơn hàng

### 5. Store Analytics
- Số lượt xem cửa hàng
- Số lượt xem sản phẩm
- Conversion rate
- Customer reviews & ratings

## Troubleshooting

### Common Issues

1. **Không load được danh sách cửa hàng**
   - Kiểm tra token còn hợp lệ
   - Kiểm tra userId trong localStorage
   - Kiểm tra API endpoint

2. **Không tạo được cửa hàng mới**
   - Kiểm tra validation fields
   - Kiểm tra authorization header
   - Xem console logs

3. **Không cập nhật được sản phẩm**
   - Kiểm tra storeId đã được chọn
   - Kiểm tra categoryId hợp lệ
   - Kiểm tra price format

4. **CSS không load**
   - Kiểm tra đường dẫn css/style.css
   - Refresh cache (Ctrl+F5)
   - Kiểm tra context path

## Kết luận

Tính năng quản lý cửa hàng cung cấp một giải pháp toàn diện cho chủ cửa hàng để:
- Quản lý thông tin cửa hàng
- Quản lý sản phẩm
- Quản lý thanh toán
- Theo dõi thống kê

Giao diện thân thiện, dễ sử dụng và tích hợp chặt chẽ với các module khác trong hệ thống FoodFast.

