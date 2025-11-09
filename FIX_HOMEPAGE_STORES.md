# Sửa Lỗi Trang Chủ và Trang Cửa Hàng

## Các Vấn Đề Đã Sửa

### 1. ✅ Trang Chủ (index.html)
- **Nút đăng nhập/đăng ký**: Đã có sẵn trong header thông qua `auth.js`
  - Khi chưa đăng nhập: hiện nút "Đăng nhập" và "Đăng ký"
  - Khi đã đăng nhập: hiện menu dropdown với thông tin user
  
- **Danh sách món ăn**: 
  - Khi **chưa đăng nhập**: Hiển thị tất cả món ăn từ API `/api/products`
  - Khi **đã đăng nhập**: Yêu cầu chọn vị trí, sau đó hiển thị món ăn từ các cửa hàng trong hành lang bay drone

- **Giỏ hàng và Đơn hàng**: Đã ẩn khi chưa đăng nhập (`style="display: none;"`)

### 2. ✅ Trang Cửa Hàng (stores.html)
- **Giỏ hàng và Đơn hàng**: Đã ẩn khi chưa đăng nhập (`id="cartNav"` và `id="ordersNav"` với `style="display: none;"`)
- **Danh sách nhà hàng**: Hiển thị tất cả nhà hàng từ API `/api/stores`
- **Thanh tìm kiếm**: Đã thêm thanh tìm kiếm cửa hàng
  - Input: `id="storeSearchInput"`
  - Chức năng: `performStoreSearch()` - tìm kiếm theo tên và mô tả cửa hàng
  - Hỗ trợ tìm kiếm theo từ khóa và hiển thị kết quả real-time

## Cách Hoạt Động

### Trang Chủ (index.html)
1. **Chưa đăng nhập**:
   - Hiện nút "Đăng nhập" và "Đăng ký" ở header
   - Hiện danh sách tất cả món ăn (không cần chọn vị trí)
   - Ẩn "Giỏ hàng" và "Đơn hàng"

2. **Đã đăng nhập**:
   - Hiện menu dropdown với avatar user
   - Yêu cầu chọn vị trí (GPS hoặc thủ công)
   - Hiện món ăn từ cửa hàng trong hành lang bay drone
   - Hiện "Giỏ hàng" và "Đơn hàng"

### Trang Cửa Hàng (stores.html)
1. **Danh sách cửa hàng**: 
   - Hiện tất cả cửa hàng dạng grid 3 cột
   - Mỗi card có ảnh, tên, mô tả, rating và nút "Xem menu"

2. **Thanh tìm kiếm**:
   - Nằm ngay dưới tiêu đề "Danh Sách Cửa Hàng"
   - Tìm kiếm theo tên hoặc mô tả cửa hàng
   - Hiển thị kết quả real-time khi nhấn Enter hoặc nút Search

3. **Chi tiết cửa hàng**:
   - Khi click "Xem menu": Hiện menu món ăn của cửa hàng đó
   - Có nút "Quay lại" để về danh sách cửa hàng

## Files Đã Thay Đổi

1. **stores.html**:
   - Thêm `style="display: none;"` cho `cartNav` và `ordersNav`
   - Thêm thanh tìm kiếm cửa hàng trong `storesListView`

2. **store.js**:
   - Thêm biến `allStoresCache` để lưu cache danh sách cửa hàng
   - Cập nhật `loadAllStores()` để cache stores
   - Thêm function `performStoreSearch()` để tìm kiếm cửa hàng

3. **main.js**:
   - Cập nhật `hideLocationDisplay()` khi chưa đăng nhập

## Kiểm Tra

### Trang Chủ
1. Truy cập `http://localhost:8080/home/`
2. Kiểm tra header có nút "Đăng nhập" và "Đăng ký"
3. Kiểm tra hiển thị danh sách món ăn
4. Không thấy "Giỏ hàng" và "Đơn hàng" trong menu

### Trang Cửa Hàng
1. Truy cập `http://localhost:8080/home/stores.html`
2. Kiểm tra hiển thị danh sách cửa hàng (grid 3 cột)
3. Kiểm tra thanh tìm kiếm hoạt động
4. Thử tìm kiếm cửa hàng theo tên
5. Click "Xem menu" để xem chi tiết cửa hàng
6. Không thấy "Giỏ hàng" và "Đơn hàng" trong menu (khi chưa đăng nhập)

## Lưu Ý

- File `auth.js` đã xử lý logic hiển thị/ẩn menu dựa trên trạng thái đăng nhập
- Khi đăng nhập thành công, `auth.updateNavbar()` sẽ tự động hiện "Giỏ hàng" và "Đơn hàng"
- Thanh tìm kiếm sử dụng filter client-side, có thể cải thiện bằng API search server-side
