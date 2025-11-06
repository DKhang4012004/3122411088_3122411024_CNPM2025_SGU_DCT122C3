# Fix: Orders Page Logout Issue

## Vấn đề (Problem)
Khi vào trang đơn hàng (orders.html), người dùng bị tự động đăng xuất với thông báo:
```
User missing ID: {username: 'danh11', userId: 27, token: 'eyJhbGc...', ...}
```

## Nguyên nhân (Root Cause)
1. **Backend** trả về `userId` trong response khi login (từ `AuthenticationResponse.java`)
2. **Frontend** (auth.js) lưu user object với field `id` (copy từ `userId`)
3. Nhưng nếu người dùng đã đăng nhập trước khi code được cập nhật, localStorage có thể chứa user object cũ chỉ có `userId` mà không có `id`
4. **orders.js** kiểm tra `user.id`, nếu không có thì force logout

## Giải pháp (Solution)

### 1. Migration trong AuthHelper (config.js)
```javascript
getUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    
    // Migration: If user doesn't have 'id' but has 'userId', fix it
    if (!user.id && user.userId) {
        user.id = user.userId;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        console.log('AuthHelper: Fixed user object structure');
    }
    
    return user;
}
```

### 2. Fallback trong orders.js
```javascript
// Check for userId field (support both old and new structure)
const userId = user.id || user.userId;
```

### 3. Migration helper trong orders.js
```javascript
function ensureUserIdField() {
    const userStr = localStorage.getItem('foodfast_user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);
    
    if (!user.id && user.userId) {
        user.id = user.userId;
        localStorage.setItem('foodfast_user', JSON.stringify(user));
        console.log('Fixed user object - added id field:', user);
    }
}
```

## Cách fix ngay lập tức (Quick Fix)

### Cách 1: Chạy script trong Console
Mở Developer Console (F12) và chạy lệnh:
```javascript
(function() {
    const userStr = localStorage.getItem('foodfast_user');
    if (!userStr) {
        console.log('No user found');
        return;
    }
    
    const user = JSON.parse(userStr);
    console.log('Current user:', user);
    
    if (!user.id && user.userId) {
        user.id = user.userId;
        localStorage.setItem('foodfast_user', JSON.stringify(user));
        console.log('✅ Fixed! Reload page (F5)');
        alert('Đã sửa lỗi! Vui lòng tải lại trang (F5)');
    } else if (user.id) {
        console.log('✅ User object is OK');
    } else {
        console.log('❌ Please login again');
        alert('Vui lòng đăng nhập lại');
    }
})();
```

### Cách 2: Đăng xuất và đăng nhập lại
1. Đăng xuất
2. Đăng nhập lại
3. Code mới sẽ tự động lưu đúng cấu trúc user object

### Cách 3: Clear localStorage
```javascript
localStorage.clear();
// Sau đó đăng nhập lại
```

## Kiểm tra (Verification)

### 1. Kiểm tra user object trong console:
```javascript
console.log(JSON.parse(localStorage.getItem('foodfast_user')));
```

Kết quả phải có cả `id` VÀ `userId`:
```javascript
{
    id: 27,           // ✅ Required
    userId: 27,       // Optional (backward compatibility)
    username: "danh11",
    email: "...",
    fullName: "...",
    roles: [...]
}
```

### 2. Kiểm tra orders load:
- Mở trang orders.html
- Mở Console (F12)
- Xem log:
```
AuthHelper: Fixed user object structure (nếu có fix)
Current user from localStorage: {...}
Loading orders for userId: 27
Orders response: {...}
```

## Files đã sửa (Modified Files)
1. ✅ `src/main/resources/static/js/config.js` - AuthHelper.getUser() migration
2. ✅ `src/main/resources/static/js/orders.js` - ensureUserIdField() và fallback logic

## Tương thích ngược (Backward Compatibility)
- ✅ User object cũ (chỉ có `userId`) sẽ tự động được fix
- ✅ User object mới (có `id`) vẫn hoạt động bình thường
- ✅ Không cần database migration vì chỉ thay đổi frontend

## Testing

### Test Case 1: User đã đăng nhập trước đây
1. Có user object cũ trong localStorage
2. Tải lại trang orders.html
3. Kỳ vọng: Tự động fix và load orders thành công

### Test Case 2: User mới đăng nhập
1. Đăng nhập lần đầu
2. Vào trang orders.html
3. Kỳ vọng: Load orders thành công ngay lập tức

### Test Case 3: User không có userId
1. User object không có cả `id` và `userId`
2. Vào trang orders.html
3. Kỳ vọng: Hiện thông báo đăng nhập lại, không crash

## Notes
- Migration chạy tự động mỗi khi gọi `AuthHelper.getUser()`
- Không ảnh hưởng đến backend
- Không cần restart server
- Chỉ cần reload trang là áp dụng fix

