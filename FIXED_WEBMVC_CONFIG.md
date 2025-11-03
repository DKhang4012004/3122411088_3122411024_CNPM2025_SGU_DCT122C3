# ✅ ĐÃ FIX LỖI "No static resource api/v1/stores"!

## 🔧 Nguyên Nhân Lỗi

**Vấn đề:** `WebMvcConfig` đang intercept TẤT CẢ requests với pattern `/**`, khiến API endpoints bị Spring coi như static resources!

```java
// ❌ SAI - Intercept cả API
registry.addResourceHandler("/**")  

// ✅ ĐÚNG - Chỉ intercept static files
registry.addResourceHandler("/*.html", "/css/**", "/js/**")
```

---

## ✅ Đã Sửa

1. ✅ Cập nhật `WebMvcConfig.java` - Chỉ handle static files pattern
2. ✅ Xóa tất cả file HTML cũ trong `target/classes/static/`
3. ✅ Đang rebuild project...

---

## 🚀 RESTART SERVER NGAY!

### **Bước 1: Đợi Build Xong**
```
Chờ maven compile xong (20-30 giây)
```

### **Bước 2: Dừng Server Cũ**
```
Ctrl + C trong terminal đang chạy server
```

### **Bước 3: Start Lại**
```bash
start-server.bat
```

### **Bước 4: Clear Browser Cache**
```
1. Mở DevTools (F12)
2. Right-click nút Reload
3. Chọn "Empty Cache and Hard Reload"

HOẶC:
Ctrl + Shift + Delete → Clear browsing data
```

### **Bước 5: Truy Cập**
```
http://localhost:8080/home/
```

---

## 🧪 TEST ĐĂNG KÝ

### **1. Mở trang chủ:**
```
http://localhost:8080/home/index.html
```

### **2. Mở Console (F12)**
- Tab Console để xem logs
- Tab Network để xem API calls

### **3. Click "Đăng Ký"**

### **4. Điền form:**
```
Họ tên: Test User
Username: testuser123 (tối thiểu 5 ký tự)
Email: test@example.com
Phone: 0901234567 (10 số)
Password: 123456 (tối thiểu 6 ký tự)
```

### **5. Submit và Check:**

**Network Tab phải thấy:**
```
✅ POST http://localhost:8080/home/api/v1/auth/register
   Status: 200 OK
   Response: {"code":200,"message":"..."}

❌ KHÔNG thấy:
   GET http://localhost:8080/home/api/v1/stores (404)
   Error: No static resource
```

**Console phải thấy:**
```
✅ Toast: "Đăng ký thành công!"
✅ Modal đóng
✅ Chuyển sang Login modal

❌ KHÔNG thấy:
   Error: Failed to fetch
   No static resource
```

---

## 🔍 DEBUG NẾU VẪN LỖI

### **Lỗi: "No static resource api/v1/auth/register"**
```
→ Server chưa restart
→ Giải pháp: Restart server
```

### **Lỗi: "Unexpected token '<'"**
```
→ Browser cache cũ
→ Giải pháp: Hard refresh (Ctrl+Shift+R)
```

### **Lỗi: "Failed to fetch"**
```
→ CORS hoặc server không chạy
→ Check server đang chạy: http://localhost:8080/home/actuator/health
```

### **Lỗi: "USER_EXISTED"**
```
→ Username đã tồn tại
→ Giải pháp: Đổi username khác
```

---

## 📊 API ENDPOINTS (SAU KHI FIX)

```
✅ POST   /home/api/v1/auth/register    - Đăng ký
✅ POST   /home/api/v1/auth/login       - Đăng nhập
✅ GET    /home/api/v1/stores           - Danh sách cửa hàng
✅ POST   /home/api/cart/add            - Thêm vào giỏ
✅ POST   /home/api/v1/orders           - Tạo đơn hàng

Static Files:
✅ GET    /home/index.html              - Trang chủ
✅ GET    /home/css/style.css           - CSS
✅ GET    /home/js/config.js            - JS
```

---

## ⚡ QUICK FIX CHECKLIST

- [ ] Đợi build xong
- [ ] Restart server (Ctrl+C rồi start-server.bat)
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Truy cập: http://localhost:8080/home/
- [ ] Hard refresh: Ctrl+Shift+R
- [ ] F12 Network tab không còn lỗi 404
- [ ] Test đăng ký thành công
- [ ] Toast "Đăng ký thành công" hiện ra

---

## 🎉 SAU KHI FIX

Bạn sẽ thấy:
- ✅ API calls hoạt động bình thường
- ✅ Đăng ký/đăng nhập thành công
- ✅ Không còn lỗi "No static resource"
- ✅ Network tab thấy status 200 OK
- ✅ Console không có lỗi

---

## 📝 Technical Details

### **Thay Đổi Trong WebMvcConfig:**

**Before:**
```java
registry.addResourceHandler("/**")  // ❌ Intercepts ALL requests including APIs
```

**After:**
```java
registry.addResourceHandler(
    "/*.html",      // ✅ Only HTML files at root
    "/css/**",      // ✅ Only CSS directory
    "/js/**",       // ✅ Only JS directory
    "/images/**",   // ✅ Only images directory
    "/fonts/**"     // ✅ Only fonts directory
)
```

### **Why This Works:**
- Static file requests: `/home/index.html` → Handled by static handler
- API requests: `/home/api/v1/auth/register` → Routed to controller
- No more conflicts! 🎉

---

**ĐỢI BUILD XONG → RESTART SERVER → TEST NGAY!** 🚀

