# 🔧 Fix: Đơn hàng biến mất sau khi chấp nhận

## ❌ Vấn đề
Khi nhấn nút "Chấp nhận" đơn hàng:
- ✅ API call thành công
- ✅ Toast hiển thị "Đã chấp nhận đơn hàng"
- ❌ Đơn hàng biến mất khỏi UI
- ❌ Không xuất hiện trong tab "Đã xác nhận"

## 🔍 Root Cause

### Backend behavior
Khi gọi `POST /api/v1/orders/{orderId}/accept`, backend:
```java
// OrderServiceImpl.java line 276
order.setStatus(OrderStatus.ACCEPT);  // ← Set status thành "ACCEPT"
```

### Frontend mapping issue
**Before fix:** Frontend chỉ có mapping cho:
```javascript
const containers = {
    'PENDING_PAYMENT': 'ordersPending',
    'PAID': 'ordersPending',
    'CONFIRMED': 'ordersConfirmed',  // ← Không có 'ACCEPT'!
    'PREPARING': 'ordersPreparing',
    // ...
};
```

**Result:** Khi order có status `ACCEPT`:
1. Không tìm thấy container match
2. Order không được render
3. Biến mất khỏi UI ❌

## ✅ Solution

### Fix 1: Add ACCEPT to container mapping
```javascript
const containers = {
    'PENDING': 'ordersPending',
    'PENDING_PAYMENT': 'ordersPending',
    'PAID': 'ordersPending',
    'ACCEPT': 'ordersConfirmed',      // ← ADDED
    'CONFIRMED': 'ordersConfirmed',
    // ...
};
```

### Fix 2: Map ACCEPT to CONFIRMED for display
```javascript
// Group orders by status for display
ordersData.forEach(order => {
    let status = order.status || 'PENDING';
    
    // Map statuses to display groups
    if (status === 'PENDING_PAYMENT' || status === 'PAID') {
        status = 'PENDING';
    } else if (status === 'ACCEPT') {
        status = 'CONFIRMED';  // ← Map ACCEPT to CONFIRMED
    }
    
    ordersByStatus[status].push(order);
});
```

### Fix 3: Update statistics
```javascript
ordersData.forEach(order => {
    const status = order.status;
    
    if (status === 'PENDING_PAYMENT' || status === 'PAID') {
        stats.PENDING++;
    } 
    else if (status === 'ACCEPT') {
        stats.CONFIRMED++;  // ← Count ACCEPT as CONFIRMED
    }
    // ...
});
```

### Fix 4: Add status text
```javascript
const statusMap = {
    'ACCEPT': 'Đã chấp nhận',  // ← ADDED
    'CONFIRMED': 'Đã xác nhận',
    // ...
};
```

### Fix 5: Handle ACCEPT in actions
```javascript
case 'ACCEPT':           // ← ADDED
case 'CONFIRMED':
    actions.push(`
        <button onclick="startPreparing(...)">
            Bắt đầu chuẩn bị
        </button>
    `);
    break;
```

## 🧪 Test Fix

### Step 1: Hard Refresh
```
Ctrl + Shift + R hoặc Ctrl + F5
```

### Step 2: Test Flow
```
1. Mở store-management.html
2. Xem đơn trong tab "Chờ xác nhận"
3. Click "Chấp nhận"
4. ✅ Đơn chuyển sang tab "Đã xác nhận"
5. ✅ Hiển thị nút "Bắt đầu chuẩn bị"
```

### Expected Console Logs
```javascript
📦 Loading orders for store: 1
✅ Loaded 1 orders

// After accepting
✅ Đã chấp nhận đơn hàng!
📦 Loading orders for store: 1
✅ Loaded 1 orders
// Order now has status: ACCEPT
```

### Expected UI
```
Tab "Chờ xác nhận": (trống)
Tab "Đã xác nhận": 
  ┌────────────────────────────────┐
  │ #ORD123   [Đã chấp nhận]       │
  │ Phở bò x2            120,000đ  │
  │ [🔥 Bắt đầu chuẩn bị]          │
  └────────────────────────────────┘
```

## 📊 Status Flow

### Backend Status Flow
```
PENDING_PAYMENT → PAID → ACCEPT → PREPARING → READY → IN_DELIVERY → DELIVERED
                          ↑
                    (sau khi click "Chấp nhận")
```

### Frontend Tab Mapping
```
Backend Status    →  Frontend Tab
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PENDING_PAYMENT   →  [Chờ xác nhận]
PAID              →  [Chờ xác nhận]
ACCEPT            →  [Đã xác nhận]  ← FIXED
CONFIRMED         →  [Đã xác nhận]
PREPARING         →  [Đang chuẩn bị]
READY             →  [Sẵn sàng]
IN_DELIVERY       →  [Đang giao]
DELIVERED         →  [Hoàn thành]
```

## 🔄 Complete Flow Test

### 1. Pending → Accept
```javascript
Status: PAID → Click "Chấp nhận" → Status: ACCEPT
Tab: "Chờ xác nhận" → "Đã xác nhận" ✅
```

### 2. Accept → Preparing
```javascript
Status: ACCEPT → Click "Bắt đầu chuẩn bị" → Status: PREPARING
Tab: "Đã xác nhận" → "Đang chuẩn bị" ✅
```

### 3. Preparing → Ready
```javascript
Status: PREPARING → Click "Sẵn sàng" → Status: READY
Tab: "Đang chuẩn bị" → "Sẵn sàng" ✅
```

### 4. Ready → Delivery
```javascript
Status: READY → Click "Giao cho drone" → Status: IN_DELIVERY
Tab: "Sẵn sàng" → "Đang giao" ✅
```

## 🐛 Troubleshooting

### Vẫn biến mất sau accept?

**Check Console:**
```javascript
// 1. Check order status after reload
ordersData.forEach(order => {
    console.log('Order:', order.id, 'Status:', order.status);
});

// 2. Check container mapping
console.log('Containers:', containers);

// 3. Check grouped orders
console.log('Orders by status:', ordersByStatus);
```

**Expected output:**
```
Order: 46 Status: ACCEPT
Orders by status: {CONFIRMED: [{id: 46, status: "ACCEPT", ...}]}
```

### Order không hiển thị nút "Bắt đầu chuẩn bị"?

**Check:** Status phải là `ACCEPT` hoặc `CONFIRMED`

**Debug:**
```javascript
console.log('Order status:', order.status);
console.log('Actions:', getOrderActions(order));
```

### Statistics không update?

**Check:** `updateStatistics()` có được gọi sau `loadOrders()` không

**Fix:** Đảm bảo trong `loadOrders()`:
```javascript
await loadOrders();
updateStatistics();      // ← Phải có
displayOrdersByStatus(); // ← Phải có
```

## 📝 Files Changed

### Modified
- ✅ `src/main/resources/static/js/store-management.js`
  - Updated `updateStatistics()` - Handle ACCEPT status
  - Updated `displayOrdersByStatus()` - Add ACCEPT mapping
  - Updated `getStatusText()` - Add ACCEPT text
  - Updated `getOrderActions()` - Handle ACCEPT in actions

### Not Changed
- Backend code (OrderServiceImpl.java) - Working as expected

## ✅ Summary

### Problem
Backend trả về status `ACCEPT` nhưng frontend không có mapping → Order biến mất

### Solution
Map `ACCEPT` status vào container `ordersConfirmed` và group với `CONFIRMED`

### Result
- ✅ Order xuất hiện trong tab "Đã xác nhận"
- ✅ Hiển thị đúng status "Đã chấp nhận"
- ✅ Có nút "Bắt đầu chuẩn bị"
- ✅ Stats cập nhật chính xác

---

**Status:** ✅ FIXED  
**Test now:** Refresh page và test accept order!  
**Date:** 2025-11-04

