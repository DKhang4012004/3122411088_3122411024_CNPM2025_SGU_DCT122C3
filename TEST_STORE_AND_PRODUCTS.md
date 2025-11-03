# 🏪 HƯỚNG DẪN TEST QUẢN LÝ CỬA HÀNG VÀ SẢN PHẨM

## 📋 Tổng Quan

Tài liệu này hướng dẫn kiểm tra đầy đủ chức năng tạo cửa hàng và thêm sản phẩm cho hệ thống FoodFast.

## 🚀 Bắt Đầu Test

### Cách 1: Sử dụng Batch File (Đơn Giản Nhất)

1. Đảm bảo server đang chạy
2. Double-click file: `test-store-products.bat`
3. Trình duyệt sẽ tự động mở trang test

### Cách 2: Mở Thủ Công

1. Mở trình duyệt
2. Truy cập: `http://localhost:8080/test-store-and-products.html`

## 📝 Các Bước Test Chi Tiết

### BƯỚC 1: Tạo Cửa Hàng Mới

1. **Điền thông tin cửa hàng:**
   - Tên cửa hàng: "Quán Phở Hà Nội"
   - Mô tả: "Phở bò chính gốc Hà Nội, nước dùng ninh từ xương bò 12 tiếng"
   - Số điện thoại: "0912345678"
   - ID Chủ cửa hàng: 1 (mặc định)

2. **Nhấn nút "Tạo Cửa Hàng"**

3. **Kiểm tra kết quả:**
   - ✅ Nếu thành công: Thông báo màu xanh hiện ra với thông tin cửa hàng
   - ❌ Nếu lỗi: Thông báo màu đỏ hiện ra với chi tiết lỗi

4. **Xác nhận cửa hàng được tạo:**
   - Cửa hàng mới xuất hiện trong "Danh Sách Cửa Hàng"
   - Số lượng cửa hàng tăng lên trong thống kê

### BƯỚC 2: Thêm Sản Phẩm Cho Cửa Hàng

1. **Chọn cửa hàng:**
   - Nhấn vào cửa hàng trong danh sách (hoặc chọn từ dropdown)
   - Cửa hàng được chọn sẽ được highlight

2. **Điền thông tin sản phẩm:**
   - Tên sản phẩm: "Phở Bò Tái"
   - Mô tả: "Phở bò với thịt tái mềm, ăn kèm rau thơm"
   - Giá: 50000 (VND)
   - ID Danh mục: 1
   - Số lượng: 100
   - Trọng lượng: 500 (gram)
   - Mã SKU: "PHO-BO-001"

3. **Nhấn nút "Thêm Sản Phẩm"**

4. **Kiểm tra kết quả:**
   - ✅ Nếu thành công: Thông báo màu xanh với thông tin sản phẩm
   - ❌ Nếu lỗi: Thông báo màu đỏ với chi tiết lỗi

### BƯỚC 3: Xem Chi Tiết Cửa Hàng Và Sản Phẩm

1. **Lấy Store ID** từ danh sách cửa hàng (ví dụ: ID = 1)

2. **Nhập Store ID** vào ô "Nhập Store ID để xem chi tiết"

3. **Nhấn "Xem Chi Tiết"**

4. **Kiểm tra kết quả:**
   - Thông tin cửa hàng hiển thị đầy đủ
   - Danh sách tất cả sản phẩm của cửa hàng
   - Thông tin chi tiết từng sản phẩm (giá, số lượng, trọng lượng, v.v.)

## 🧪 Test Cases Nâng Cao

### Test Case 1: Tạo Nhiều Cửa Hàng

```
Mục đích: Kiểm tra hệ thống có xử lý được nhiều cửa hàng không

Các bước:
1. Tạo cửa hàng 1: "Quán Phở Hà Nội"
2. Tạo cửa hàng 2: "Bún Chả Obama"
3. Tạo cửa hàng 3: "Bánh Mì Pate"

Kết quả mong đợi:
- Cả 3 cửa hàng được tạo thành công
- Danh sách hiển thị đầy đủ 3 cửa hàng
- Số lượng cửa hàng = 3
```

### Test Case 2: Thêm Nhiều Sản Phẩm Cho Một Cửa Hàng

```
Mục đích: Kiểm tra một cửa hàng có thể có nhiều sản phẩm

Các bước:
1. Chọn cửa hàng "Quán Phở Hà Nội"
2. Thêm sản phẩm 1: "Phở Bò Tái" - 50,000 VND
3. Thêm sản phẩm 2: "Phở Gà" - 45,000 VND
4. Thêm sản phẩm 3: "Bún Riêu" - 40,000 VND
5. Thêm sản phẩm 4: "Nem Rán" - 30,000 VND

Kết quả mong đợi:
- Tất cả sản phẩm được thêm thành công
- Khi xem chi tiết cửa hàng, hiển thị đủ 4 sản phẩm
```

### Test Case 3: Kiểm Tra Validation

```
Mục đích: Đảm bảo hệ thống validate đầu vào đúng

Test 3.1 - Tạo cửa hàng thiếu tên:
1. Để trống "Tên cửa hàng"
2. Nhấn "Tạo Cửa Hàng"
Kết quả: Hiển thị lỗi validation

Test 3.2 - Thêm sản phẩm không chọn cửa hàng:
1. Không chọn cửa hàng trong dropdown
2. Điền thông tin sản phẩm
3. Nhấn "Thêm Sản Phẩm"
Kết quả: Hiển thị cảnh báo "Vui lòng chọn cửa hàng trước!"

Test 3.3 - Giá sản phẩm âm:
1. Nhập giá = -1000
2. Nhấn "Thêm Sản Phẩm"
Kết quả: Hiển thị lỗi validation
```

### Test Case 4: Test API Trực Tiếp

```
Mục đích: Kiểm tra API hoạt động độc lập

Sử dụng Postman hoặc curl:

1. Tạo cửa hàng:
POST http://localhost:8080/api/stores
Body: {
  "name": "Test Store",
  "description": "Test Description",
  "phoneNumber": "0123456789",
  "ownerUserId": 1
}

2. Thêm sản phẩm:
POST http://localhost:8080/api/stores/{storeId}/products
Body: {
  "categoryId": 1,
  "sku": "TEST-001",
  "name": "Test Product",
  "description": "Test Description",
  "basePrice": 10000,
  "currency": "VND",
  "quantityAvailable": 100,
  "weightGram": 500
}

3. Xem sản phẩm của cửa hàng:
GET http://localhost:8080/api/stores/{storeId}/products
```

## 🎯 Checklist Kiểm Tra Đầy Đủ

### Chức Năng Cửa Hàng
- [ ] Tạo cửa hàng thành công
- [ ] Thông tin cửa hàng hiển thị đúng
- [ ] Có thể tạo nhiều cửa hàng
- [ ] Cửa hàng xuất hiện trong danh sách
- [ ] Có thể chọn cửa hàng từ danh sách
- [ ] Có thể chọn cửa hàng từ dropdown
- [ ] Status cửa hàng hiển thị đúng (Active/Inactive)
- [ ] Số lượng cửa hàng cập nhật đúng

### Chức Năng Sản Phẩm
- [ ] Thêm sản phẩm thành công
- [ ] Thông tin sản phẩm hiển thị đúng
- [ ] Có thể thêm nhiều sản phẩm cho một cửa hàng
- [ ] Giá sản phẩm hiển thị đúng định dạng
- [ ] Số lượng sản phẩm cập nhật đúng
- [ ] Trọng lượng sản phẩm hiển thị đúng
- [ ] SKU tự động tạo nếu không nhập

### Chức Năng Xem Chi Tiết
- [ ] Xem được thông tin cửa hàng
- [ ] Xem được danh sách sản phẩm của cửa hàng
- [ ] Thông tin chi tiết sản phẩm đầy đủ
- [ ] Tổng số sản phẩm hiển thị đúng

### UI/UX
- [ ] Giao diện đẹp, dễ sử dụng
- [ ] Responsive trên mobile
- [ ] Thông báo thành công/lỗi rõ ràng
- [ ] Loading state hiển thị khi đang xử lý
- [ ] Các form reset sau khi submit thành công
- [ ] Cửa hàng được chọn có highlight
- [ ] Thống kê cập nhật real-time

## 🐛 Các Lỗi Thường Gặp

### Lỗi 1: "Failed to fetch" hoặc "Network error"
**Nguyên nhân:** Server chưa chạy hoặc port sai
**Giải pháp:** 
- Kiểm tra server đang chạy: `http://localhost:8080`
- Chạy: `start-server.bat`

### Lỗi 2: "No static resource test-store-and-products.html"
**Nguyên nhân:** File HTML chưa được copy vào target
**Giải pháp:**
- Build lại project: `mvnw clean package`
- Restart server

### Lỗi 3: "Store not found"
**Nguyên nhân:** Nhập sai Store ID
**Giải pháp:**
- Kiểm tra lại Store ID trong danh sách cửa hàng

### Lỗi 4: "Validation failed"
**Nguyên nhân:** Thiếu thông tin bắt buộc hoặc dữ liệu không hợp lệ
**Giải pháp:**
- Kiểm tra các trường có dấu * (bắt buộc)
- Đảm bảo giá > 0, số lượng >= 0

## 📊 Kết Quả Mong Đợi

Sau khi test xong, bạn nên có:

1. **Ít nhất 3 cửa hàng** với thông tin đầy đủ
2. **Mỗi cửa hàng có 3-5 sản phẩm** khác nhau
3. **Tất cả chức năng hoạt động** không có lỗi
4. **UI hiển thị đẹp** và dễ sử dụng

## 🎉 Hoàn Thành

Nếu tất cả các test case đều PASS, chúc mừng! 

Hệ thống quản lý cửa hàng và sản phẩm đã hoạt động đúng! ✅

## 📞 Liên Hệ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra lại các bước trong tài liệu
2. Xem log của server
3. Kiểm tra Postman collection để test API trực tiếp

---

**Tài liệu được tạo:** November 2, 2025
**Phiên bản:** 1.0

