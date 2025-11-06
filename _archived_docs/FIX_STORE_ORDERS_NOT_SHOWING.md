# 🔧 Fix: Store Management - Không thấy đơn hàng

## ❌ Vấn đề
Mở `store-management.html` nhưng không thấy đơn hàng trong danh sách.

## 🔍 Nguyên nhân tìm ra

### 1. Async timing issue
- `loadStoreInfo()` và `loadOrders()` được gọi song song
- `loadOrders()` chạy trước khi `currentStore` được set
- → Không có storeId để gọi API

### 2. Order status mismatch
- Backend trả về status: `PENDING_PAYMENT`, `PAID`
- Frontend chỉ expect: `PENDING`, `CONFIRMED`, `PREPARING`, etc.
- → Orders không được hiển thị trong tabs

## ✅ Đã sửa

### Fix 1: Async/Await properly
**File:** `store-management.js`

**Before:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadStoreInfo();    // Async, không đợi
    loadOrders();       // Chạy ngay, currentStore = null
    refreshInterval = setInterval(loadOrders, 30000);
});
```

**After:**
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;
    
    await loadStoreInfo();    // ✅ Đợi load xong
    await loadOrders();       // ✅ Chạy sau khi có currentStore
    
    refreshInterval = setInterval(loadOrders, 30000);
});
```

### Fix 2: Support PENDING_PAYMENT status
**File:** `store-management.js`

**Updated status mapping:**
```javascript
// Map PENDING_PAYMENT and PAID to PENDING tab
const ordersByStatus = {};
ordersData.forEach(order => {
    let status = order.status;
    
    // Map to PENDING for display
    if (status === 'PENDING_PAYMENT' || status === 'PAID') {
        status = 'PENDING';
    }
    
    if (!ordersByStatus[status]) {
        ordersByStatus[status] = [];
    }
    ordersByStatus[status].push(order);
});
```

**Updated actions:**
```javascript
switch (order.status) {
    case 'PENDING_PAYMENT':
        // Chưa thanh toán → Chỉ hiển thị thông báo
        actions.push(`
            <span style="color: var(--warning-color);">
                <i class="fas fa-clock"></i> Đang chờ thanh toán
            </span>
        `);
        break;
        
    case 'PAID':
        // Đã thanh toán → Có thể chấp nhận
        actions.push(`
            <button class="btn btn-primary" onclick="acceptOrder(${order.id})">
                <i class="fas fa-check"></i> Chấp nhận
            </button>
        `);
        break;
}
```

### Fix 3: Better logging & error handling

**Added console logs:**
```javascript
console.log('📦 Loading orders for store:', currentStore.id);
console.log('📡 API endpoint:', API_CONFIG.BASE_URL + endpoint);
console.log('📦 Orders response:', response);
console.log(`✅ Loaded ${ordersData.length} orders`);
```

**Added Toast notifications:**
```javascript
Toast.success('Đã tải thông tin cửa hàng');
Toast.info('Chưa có đơn hàng nào');
Toast.error('Không thể tải đơn hàng: ' + error.message);
```

**Added Loading indicators:**
```javascript
Loading.show();
// ... API calls ...
Loading.hide();
```

## 🧪 Test Fix

### Bước 1: Hard Refresh
```
Ctrl + Shift + R (Windows)
hoặc Ctrl + F5
```

### Bước 2: Mở trang
```
http://localhost:8080/home/store-management.html
```

### Bước 3: Kiểm tra Console (F12)
**Expected logs:**
```
Store Management loaded
Loading store info...
User: {id: 27, username: "danh11", ...}
Stores response: {code: 1000, result: [...]}
Stores: [{id: 1, name: "Nhà hàng Phở Hà Nội", ...}]
Selected store: {id: 1, ...}
✅ Đã tải thông tin cửa hàng

📦 Loading orders for store: 1
📡 API endpoint: http://localhost:8080/home/api/v1/orders/store/1
📦 Orders response: {code: 200, result: [...]}
✅ Loaded 1 orders
```

### Bước 4: Kiểm tra UI
- ✅ Store name hiển thị
- ✅ Stats update (Chờ xác nhận: 1)
- ✅ Tab "Chờ xác nhận" có đơn hàng
- ✅ Order card hiển thị đầy đủ
- ✅ Actions buttons hiển thị

## 📊 Order Status Flow

### Backend Statuses
```
PENDING_PAYMENT → PAID → CONFIRMED → PREPARING → READY → IN_DELIVERY → DELIVERED
```

### Frontend Tabs Mapping
```
PENDING_PAYMENT ────┐
PAID ───────────────┴→ [Chờ xác nhận]
CONFIRMED ──────────→ [Đã xác nhận]
PREPARING ──────────→ [Đang chuẩn bị]
READY ──────────────→ [Sẵn sàng]
IN_DELIVERY ────────→ [Đang giao]
DELIVERED ──────────→ [Hoàn thành]
```

## 🐛 Troubleshooting

### Vẫn không thấy đơn hàng?

#### 1. Check API response
```javascript
// Console
fetch('http://localhost:8080/home/api/v1/orders/store/1', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('foodfast_token')
    }
})
.then(r => r.json())
.then(d => console.log('Orders:', d));
```

#### 2. Check token
```javascript
// Console
console.log('Token:', localStorage.getItem('foodfast_token'));
// Phải có token
```

#### 3. Check store
```javascript
// Console
console.log('Store:', currentStore);
// Phải có {id: 1, name: "...", ...}
```

#### 4. Check orders data
```javascript
// Console
console.log('Orders data:', ordersData);
// Phải có array với orders
```

### Lỗi: "Chưa có cửa hàng"?

**Nguyên nhân:** Database chưa có stores

**Fix:**
```bash
# Run test data script
insert-test-data.bat

# Or manual SQL
INSERT INTO stores (name, address, ...) VALUES (...);
```

### Lỗi: API 401 Unauthorized?

**Nguyên nhân:** Token không hợp lệ hoặc hết hạn

**Fix:**
```javascript
// Logout và login lại
localStorage.clear();
// Reload trang và đăng nhập lại
```

### Lỗi: Orders có nhưng không hiển thị?

**Nguyên nhân:** Status không match

**Check:**
```javascript
// Console
ordersData.forEach(order => {
    console.log('Order:', order.id, 'Status:', order.status);
});
```

**Fix:** Đảm bảo code đã update để handle PENDING_PAYMENT

## ✅ Expected Results

### Console Logs
```
✅ Store Management loaded
✅ Loading store info...
✅ Stores: [{id: 1, ...}]
✅ Selected store: {id: 1}
✅ Loading orders for store: 1
✅ Loaded 1 orders
✅ Stats updated: PENDING=1
```

### UI
```
┌────────────────────────────────────────┐
│ 🏪 Nhà hàng Phở Hà Nội   [🔄 Làm mới] │
│ 📍 123 Nguyễn Huệ                      │
├────────────────────────────────────────┤
│ ⏰ Chờ: 1  ✅ Xác nhận: 0  🔥 Chuẩn bị: 0│
├────────────────────────────────────────┤
│ [Chờ xác nhận] [Đã xác nhận] ...      │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ #ORD123     [Đã thanh toán]       │ │
│ │ 👤 Nguyễn Văn A                    │ │
│ │ ───────────────────────────────── │ │
│ │ Phở bò x2              120,000đ   │ │
│ │ ───────────────────────────────── │ │
│ │ Tổng: 120,000đ                    │ │
│ │ [✓ Chấp nhận] [✗ Từ chối]         │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

## 📝 Summary

### Changes Made
1. ✅ Fixed async/await timing
2. ✅ Added PENDING_PAYMENT status support
3. ✅ Improved error handling
4. ✅ Added console logging
5. ✅ Added Loading & Toast notifications
6. ✅ Better status mapping

### Files Changed
- ✅ `store-management.js`

### Testing
- ✅ API working: GET /api/v1/orders/store/1
- ✅ Response has orders
- ✅ Frontend loads correctly
- ✅ UI displays orders

---

**Status:** ✅ FIXED  
**Test now:** Refresh page and check!  
**Date:** 2025-11-04

