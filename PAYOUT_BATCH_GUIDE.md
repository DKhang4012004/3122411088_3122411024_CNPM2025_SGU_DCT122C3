## ⚠️ LƯU Ý QUAN TRỌNG
| 6 | UNPAID | NULL |
### 🔴 Store Ledger chỉ được tạo khi nhà hàng CHẤP NHẬN đơn
**✅ Kết quả:**
**Tại sao?**
- Khách thanh toán → Tiền vào hệ thống (nhưng chưa xác định nhà hàng có nhận đơn không)
- Nhà hàng có thể **TỪ CHỐI** đơn hàng (hết hàng, không nhận đơn...)
- Chỉ khi nhà hàng **CHẤP NHẬN** (status = ACCEPT), hệ thống mới ghi nhận khoản nợ phải trả cho nhà hàng
- Các ledger trả về UNPAID và bỏ liên kết với batch
**Luồng chi tiết:**

Thanh toán (PAID) → Chờ nhà hàng xác nhận
                          ↓
                 ┌────────┴────────┐
                 ↓                 ↓
          ACCEPT (✅)         REJECT (❌)
          Tạo ledger         Không tạo ledger
          Nợ nhà hàng        Hoàn tiền khách
```

#### Request:
```http
POST /api/v1/payouts/batches/1/retry
```
(Batch có status = PAID)

#### Response:
```json
{
  "code": 400,
  "message": "Only FAILED payout batches can be retried"
}
```

---

## 📈 Báo cáo & Thống kê

### Báo cáo doanh thu cửa hàng

```sql
SELECT 
    s.id,
    s.name,
    COUNT(DISTINCT o.id) AS total_orders,
    SUM(o.total_payable) AS gross_revenue,
    SUM(sl.app_commission_amount) AS total_commission,
    SUM(sl.payment_gateway_fee) AS total_gateway_fee,
    SUM(sl.net_amount_owed) AS net_revenue,
    SUM(CASE WHEN sl.status = 'PAID' THEN sl.net_amount_owed ELSE 0 END) AS paid_amount,
    SUM(CASE WHEN sl.status = 'UNPAID' THEN sl.net_amount_owed ELSE 0 END) AS pending_payout
FROM store s
LEFT JOIN orders o ON s.id = o.store_id AND o.status IN ('ACCEPT', 'IN_DELIVERY', 'DELIVERED')
LEFT JOIN store_ledger sl ON o.id = sl.order_id
GROUP BY s.id, s.name;
```

### Báo cáo Payout Batch theo tháng

```sql
SELECT 
    DATE_FORMAT(pb.created_at, '%Y-%m') AS month,
    COUNT(*) AS batch_count,
    SUM(pb.total_payout_amount) AS total_payout,
    SUM(CASE WHEN pb.status = 'PAID' THEN pb.total_payout_amount ELSE 0 END) AS paid_amount,
    SUM(CASE WHEN pb.status = 'PENDING' THEN pb.total_payout_amount ELSE 0 END) AS pending_amount,
    SUM(CASE WHEN pb.status = 'FAILED' THEN pb.total_payout_amount ELSE 0 END) AS failed_amount
FROM payout_batch pb
WHERE pb.created_at >= '2025-01-01'
GROUP BY DATE_FORMAT(pb.created_at, '%Y-%m')
ORDER BY month DESC;
```

---

## 🔐 Bảo mật & Kiểm soát

### 1. Validation
- ✅ Chỉ tạo batch cho ledger UNPAID
- ✅ Không cho phép duplicate batch cho cùng ledger
- ✅ Kiểm tra trạng thái trước khi process/mark paid

### 2. Transaction
- ✅ Tất cả operations đều wrapped trong @Transactional
- ✅ Rollback tự động nếu có lỗi

### 3. Audit Trail
- ✅ Log tất cả thao tác
- ✅ Timestamp cho created_at, processed_at
- ✅ Lưu transaction_code, notes

---

**Created:** November 2, 2025  
**Version:** 2.0  
**Author:** FoodFast Development Team

