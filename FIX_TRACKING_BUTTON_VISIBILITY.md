# 🔧 Fix: Không Thấy Nút "Theo Dõi" Giao Hàng

## ❌ Vấn Đề

Sau khi cửa hàng chấp nhận đơn hàng, khách hàng không thấy nút **"🚁 Theo dõi"** để xem quá trình giao hàng drone.

**Triệu chứng:**
- Đơn hàng có status: `ACCEPT` hoặc `CONFIRMED` ("Đã xác nhận - Chuẩn bị giao")
- Không có nút "Theo dõi" trong trang Orders
- Phải đợi 1 phút (khi drone khởi hành) mới thấy nút

---

## 🔍 Nguyên Nhân

Code cũ trong `orders.js` chỉ hiển thị nút "Theo dõi" khi:
```javascript
order.status === 'IN_DELIVERY' || order.status === 'PAID'
```

**Vấn đề:** Trong flow hiện tại:
1. Store chấp nhận → Order status: `ACCEPT`
2. Drone được phân công → Delivery status: `ASSIGNED`
3. **Sau 1 phút** → Drone khởi hành → Order status: `IN_DELIVERY`

→ Khách hàng phải đợi 1 phút mới thấy nút "Theo dõi"!

---

## ✅ Giải Pháp

### Code Cũ (Line 347-351 in orders.js):
```javascript
${order.status === 'IN_DELIVERY' || order.status === 'PAID' ? `
    <button class="btn btn-primary btn-sm" onclick="trackDelivery(${order.id})">
        <i class="fas fa-drone"></i> Theo dõi
    </button>
` : ''}
```

### Code Mới:
```javascript
${['ACCEPT', 'CONFIRMED', 'IN_DELIVERY', 'PAID'].includes(order.status) ? `
    <button class="btn btn-primary btn-sm" onclick="trackDelivery(${order.id})">
        <i class="fas fa-drone"></i> Theo dõi
    </button>
` : ''}
```

**Thay đổi:**
- ✅ Nút hiển thị ngay khi order được ACCEPT (có delivery)
- ✅ Không cần đợi drone khởi hành
- ✅ Khách hàng có thể theo dõi từ giai đoạn "Chuẩn bị" (ASSIGNED)

---

## 🎯 File Đã Sửa

**File:** `src/main/resources/static/js/orders.js`

**Line:** 347

**Commit Message:**
```
fix: Show tracking button immediately when order is ACCEPT

- Allow customers to track delivery from ACCEPT status
- No need to wait for IN_DELIVERY status
- Better UX for early tracking access
```

---

## 🧪 Cách Test

### **Before Fix:**
```
1. Customer đặt hàng → PAID
2. Store chấp nhận → ACCEPT
3. Check orders page → ❌ Không thấy nút "Theo dõi"
4. Đợi 1 phút → IN_DELIVERY
5. Check orders page → ✅ Thấy nút "Theo dõi"
```

### **After Fix:**
```
1. Customer đặt hàng → PAID
2. Store chấp nhận → ACCEPT
3. Check orders page → ✅ Thấy nút "Theo dõi" ngay!
4. Click "Theo dõi" → Xem delivery status: ASSIGNED
   - Map hiển thị store, customer, drone ở vị trí store
   - Timeline: "✅ Đã phân công drone"
   - Message: "Drone đang chuẩn bị khởi hành..."
5. Đợi 1 phút → Drone bay (status: LAUNCHED/IN_DELIVERY)
6. Refresh tracking page → Xem drone di chuyển!
```

---

## 📋 Steps to Verify

### 1. Rebuild Project
```powershell
.\mvnw.cmd compile -DskipTests
```

### 2. Restart Server
```powershell
.\start-server.bat
```

### 3. Test Flow
```
A. Customer Login (customer1/password123)
   → Đặt hàng + Thanh toán
   
B. Store Login (store1/password123)
   → Chấp nhận đơn hàng
   
C. Customer Login (quay lại)
   → Vào Orders page
   → ✅ CHECK: Thấy nút "🚁 Theo dõi" ngay lập tức
   
D. Click "Theo dõi"
   → ✅ CHECK: Trang tracking mở ra
   → ✅ CHECK: Map hiển thị 3 marker (store, drone, customer)
   → ✅ CHECK: Timeline hiển thị "Đã phân công drone"
   → ✅ CHECK: Drone ở vị trí store (chưa bay)
   
E. Đợi 1 phút
   → ✅ CHECK: Status tự động chuyển sang LAUNCHED
   → ✅ CHECK: Drone bắt đầu di chuyển trên map
   → ✅ CHECK: Progress bar tăng dần
```

---

## 🎬 User Experience Comparison

### ❌ Before (Bad UX):
```
Customer: "Tôi muốn xem drone đang ở đâu?"
→ Không thấy nút "Theo dõi"
→ Phải đợi 1 phút
→ Không biết hệ thống có đang xử lý không
→ ❌ Confusing!
```

### ✅ After (Good UX):
```
Customer: "Tôi muốn xem drone đang ở đâu?"
→ Click "🚁 Theo dõi" ngay lập tức
→ Thấy: "Drone đang chuẩn bị khởi hành..."
→ Biết hệ thống đang xử lý
→ ✅ Clear status!
```

---

## 🔄 Complete Flow After Fix

### Timeline từ khi Store Chấp Nhận:

| Thời gian | Order Status | Delivery Status | Nút "Theo dõi" | Hiển thị Tracking |
|-----------|--------------|-----------------|----------------|-------------------|
| **T+0s** | `ACCEPT` | `ASSIGNED` | ✅ Hiển thị | ✅ "Đang chuẩn bị..." |
| **T+30s** | `ACCEPT` | `ASSIGNED` | ✅ Hiển thị | ✅ "Đang chuẩn bị..." |
| **T+1min** | `IN_DELIVERY` | `LAUNCHED` | ✅ Hiển thị | ✅ Drone bay! |
| **T+8min** | `IN_DELIVERY` | `ARRIVING` | ✅ Hiển thị | ✅ "Sắp đến!" |
| **T+10min** | `DELIVERED` | `COMPLETED` | ❌ Ẩn | ✅ "Hoàn thành" |

**Key Improvement:**
- ✅ Nút "Theo dõi" hiển thị **ngay lập tức** từ T+0s
- ✅ Customer có thể theo dõi từ giai đoạn ASSIGNED
- ✅ Không có "dead time" (thời gian không có thông tin)

---

## 📱 What Customer Will See

### **Giai đoạn 1: ACCEPT/ASSIGNED (T+0 → T+1min)**

Click "Theo dõi" → Trang tracking hiển thị:

```
┌─────────────────────────────────────────┐
│  🚁 Drone đang chuẩn bị khởi hành       │
├─────────────────────────────────────────┤
│  🗺️ Bản đồ:                            │
│     🏪 Store (cửa hàng)                 │
│     🚁 Drone (tại vị trí store)         │
│     📍 Customer (điểm đến)              │
├─────────────────────────────────────────┤
│  📊 Progress: 0%                        │
│  ⏱️ ETA: Đang tính toán...              │
├─────────────────────────────────────────┤
│  Timeline:                              │
│  ✅ Đã phân công drone                  │
│  ⏳ Chờ khởi hành...                    │
│  ⏸️ Đang bay                            │
│  ⏸️ Sắp đến                             │
│  ⏸️ Hoàn thành                          │
└─────────────────────────────────────────┘
```

### **Giai đoạn 2: LAUNCHED/IN_DELIVERY (T+1min → T+8min)**

Auto refresh mỗi 5 giây → Tracking hiển thị:

```
┌─────────────────────────────────────────┐
│  🚁 Drone đang bay đến địa chỉ của bạn  │
├─────────────────────────────────────────┤
│  🗺️ Bản đồ:                            │
│     🏪 Store (cửa hàng)                 │
│     🚁 Drone (đang di chuyển)           │
│     📍 Customer (điểm đến)              │
│     ⎯⎯⎯ Đường bay (dashed line)         │
├─────────────────────────────────────────┤
│  📊 Progress: 45%                       │
│  ⏱️ ETA: 15:30 (5 phút nữa)            │
├─────────────────────────────────────────┤
│  Timeline:                              │
│  ✅ Đã phân công drone                  │
│  ✅ Đã khởi hành (15:20)                │
│  ⏳ Đang bay...                          │
│  ⏸️ Sắp đến                             │
│  ⏸️ Hoàn thành                          │
└─────────────────────────────────────────┘
```

---

## 🐛 Potential Issues & Solutions

### Issue 1: "Chưa có thông tin giao hàng"

**Nguyên nhân:** Delivery chưa được tạo (store chưa chấp nhận đơn)

**Giải pháp:**
```javascript
async function trackDelivery(orderId) {
    const response = await APIHelper.get(API_CONFIG.ENDPOINTS.DELIVERY_BY_ORDER(orderId));
    const delivery = response.result;
    
    if (!delivery) {
        Toast.warning('Chưa có thông tin giao hàng');
        Loading.hide();
        return;  // ✅ Đã xử lý trong code
    }
    
    window.location.href = `/home/delivery-tracking.html?deliveryId=${delivery.id}`;
}
```

### Issue 2: Map Không Hiển Thị Drone Position

**Nguyên nhân:** Drone chưa khởi hành, `dronePosition` null

**Giải pháp:** Trong `delivery-tracking.html`, mặc định drone ở vị trí store:
```javascript
// If drone hasn't launched, show it at store position
const dronePos = data.dronePosition || data.storePosition;
```

### Issue 3: Progress Luôn Là 0%

**Nguyên nhân:** `actualDepartureTime` chưa được set

**Giải pháp:** Backend `DeliveryService.calculateProgress()`:
```java
if (delivery.getActualDepartureTime() == null) {
    return 0.0; // Chưa khởi hành
}
// Calculate based on time elapsed
```

---

## 📊 Status Mapping

| Order Status | Delivery Status | Nút "Theo dõi" | Mô Tả |
|--------------|-----------------|----------------|-------|
| `PENDING` | - | ❌ | Chờ thanh toán |
| `PAID` | `QUEUED` | ✅ | Có delivery, chờ gán drone |
| `ACCEPT` | `ASSIGNED` | ✅ | Đã gán drone, chuẩn bị bay |
| `ACCEPT` | `LAUNCHED` | ✅ | Drone đã cất cánh (rare case) |
| `IN_DELIVERY` | `LAUNCHED` | ✅ | Drone đang bay |
| `IN_DELIVERY` | `ARRIVING` | ✅ | Drone sắp đến |
| `DELIVERED` | `COMPLETED` | ❌ | Đã giao xong |
| `CANCELLED` | `FAILED/RETURNED` | ❌ | Đã hủy |

**Note:** Theo code hiện tại, khi drone LAUNCHED, Order status tự động chuyển sang `IN_DELIVERY`.

---

## 🎯 Summary

### What Changed:
- ✅ Nút "Theo dõi" hiển thị từ status `ACCEPT` (thay vì chỉ `IN_DELIVERY`)
- ✅ Cho phép tracking từ giai đoạn ASSIGNED (drone đang chuẩn bị)
- ✅ Better UX - không có "dead time"

### Files Modified:
- `src/main/resources/static/js/orders.js` (line 347)

### Testing:
```powershell
# Rebuild
.\mvnw.cmd compile -DskipTests

# Restart
.\start-server.bat

# Test
1. Customer đặt hàng
2. Store chấp nhận
3. Customer → Orders page
4. ✅ Thấy nút "🚁 Theo dõi" ngay lập tức!
```

### Next Steps:
- [ ] Test với nhiều đơn hàng
- [ ] Test khi không có drone available
- [ ] Test khi delivery failed
- [ ] Add unit tests cho tracking button visibility

---

**Related Docs:**
- 📄 `HOW_TO_TRACK_DELIVERY.md` - Hướng dẫn sử dụng
- 📄 `DRONE_TRACKING_GUIDE.md` - Chi tiết kỹ thuật
- 📄 `COMPLETE_BUSINESS_FLOW_ANALYSIS.md` - Business flow

---

**✅ Fixed:** Nút "Theo dõi" giờ hiển thị ngay sau khi store chấp nhận đơn hàng!
