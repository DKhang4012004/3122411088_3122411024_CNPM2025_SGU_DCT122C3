# 📚 FoodFast - Documentation Index

Tổng hợp tất cả tài liệu của project.

---

## 🚀 Quick Links

| Tài liệu | Mô tả | Link |
|----------|-------|------|
| **README.md** | Hướng dẫn chính, quick start | [README.md](README.md) |
| **COMPLETE_FLOW_GUIDE.md** | Hướng dẫn test đầy đủ từ A-Z | [COMPLETE_FLOW_GUIDE.md](COMPLETE_FLOW_GUIDE.md) |
| **ORDER_FLOW_SIMPLIFIED.md** | Flow xử lý đơn hàng (simplified) | [ORDER_FLOW_SIMPLIFIED.md](ORDER_FLOW_SIMPLIFIED.md) |
| **API_ENDPOINTS_COMPLETE.md** | Danh sách API endpoints đầy đủ | [API_ENDPOINTS_COMPLETE.md](API_ENDPOINTS_COMPLETE.md) |
| **ALL_FIXES_COMPLETE.md** | Tổng hợp các fixes đã thực hiện | [ALL_FIXES_COMPLETE.md](ALL_FIXES_COMPLETE.md) |

---

## 📖 Hướng Dẫn Sử Dụng

### Bắt đầu
1. **README.md** - Đọc đầu tiên để setup project
2. **COMPLETE_FLOW_GUIDE.md** - Test toàn bộ flow

### Cho Developer
1. **API_ENDPOINTS_COMPLETE.md** - API reference
2. **ORDER_FLOW_SIMPLIFIED.md** - Hiểu order flow
3. **Postman Collections** - Test APIs

### Troubleshooting
1. **ALL_FIXES_COMPLETE.md** - Xem các fixes
2. **_archived_docs/** - Lịch sử fixes cũ

---

## 🗂️ Cấu Trúc Docs

```
foodfast/
├── README.md                           ⭐ Main documentation
├── COMPLETE_FLOW_GUIDE.md              ⭐ Full test guide
├── ORDER_FLOW_SIMPLIFIED.md            ⭐ Order flow
├── API_ENDPOINTS_COMPLETE.md           📡 API reference
├── ALL_FIXES_COMPLETE.md               🔧 Fixes summary
├── docs/                               📁 Additional docs
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DELIVERY_SYSTEM_COMPLETE.md
│   └── FRONTEND_100_COMPLETE.md
├── _archived_docs/                     📦 Old docs (archived)
│   ├── FIX_*.md
│   ├── FINAL_*.md
│   └── BUG_*.md
└── Postman Collections/
    ├── Complete_Order_Flow_Test.postman_collection.json
    ├── Delivery_Complete_Flow.postman_collection.json
    └── Drone_Complete_APIs.postman_collection.json
```

---

## 🎯 Use Cases

### 1. "Tôi muốn chạy project"
→ Đọc **README.md** → Làm theo Quick Start

### 2. "Tôi muốn test toàn bộ flow"
→ Đọc **COMPLETE_FLOW_GUIDE.md** → Test từng bước

### 3. "Tôi muốn biết order flow hoạt động thế nào"
→ Đọc **ORDER_FLOW_SIMPLIFIED.md** → Hiểu flow

### 4. "Tôi muốn gọi API"
→ Đọc **API_ENDPOINTS_COMPLETE.md** → Import Postman

### 5. "Có bug, fix như thế nào?"
→ Đọc **ALL_FIXES_COMPLETE.md** → Tìm fix tương tự

### 6. "Tôi muốn xem lịch sử fixes"
→ Vào **_archived_docs/** → Xem các file cũ

---

## 📊 Document Status

| Document | Status | Last Updated | Notes |
|----------|--------|--------------|-------|
| README.md | ✅ Current | 2025-11-04 | Main guide |
| COMPLETE_FLOW_GUIDE.md | ✅ Current | 2025-11-04 | Full test guide |
| ORDER_FLOW_SIMPLIFIED.md | ✅ Current | 2025-11-04 | Latest flow |
| API_ENDPOINTS_COMPLETE.md | ✅ Current | 2025-11-03 | API docs |
| ALL_FIXES_COMPLETE.md | ✅ Current | 2025-11-04 | Fixes summary |
| _archived_docs/* | 📦 Archived | Various | Old versions |

---

## 🔄 Document Updates

### Latest Changes (2025-11-04)
- ✅ Created new README.md (comprehensive)
- ✅ Simplified order flow (removed PREPARING, READY)
- ✅ Archived old documentation files
- ✅ Cleaned up BAT files
- ✅ Created this INDEX.md

### Previous Changes
- See **_archived_docs/** for historical changes

---

## 📝 Notes

### Documentation Standards
- ✅ Use Markdown (.md)
- ✅ Clear headers and sections
- ✅ Code examples with syntax highlighting
- ✅ Emojis for visual clarity
- ✅ Tables for structured data

### File Naming
- **README.md** - Main documentation
- **COMPLETE_*.md** - Comprehensive guides
- **API_*.md** - API documentation
- **FIX_*.md** - Bug fixes (archived)
- **GUIDE_*.md** - Specific guides

### Archive Policy
Old documentation moved to `_archived_docs/` to keep root clean.
Keep for reference but not actively maintained.

---

## 🆘 Support

### Where to Get Help
1. Check **README.md** troubleshooting section
2. Check **ALL_FIXES_COMPLETE.md** for known issues
3. Search **_archived_docs/** for specific fixes
4. Check Postman collections for API examples

### Common Issues
| Issue | Solution | Document |
|-------|----------|----------|
| Can't login | Check user credentials | README.md |
| Orders not showing | Run user fix script | ALL_FIXES_COMPLETE.md |
| VNPay redirect logout | Auto-handled by system | ALL_FIXES_COMPLETE.md |
| Drone not available | Check database drones | COMPLETE_FLOW_GUIDE.md |

---

## 🎓 Learning Path

### Beginner
1. README.md → Setup project
2. COMPLETE_FLOW_GUIDE.md → Understand flow
3. Test with UI

### Intermediate
1. API_ENDPOINTS_COMPLETE.md → Learn APIs
2. Postman Collections → Test APIs
3. ORDER_FLOW_SIMPLIFIED.md → Understand business logic

### Advanced
1. docs/SYSTEM_ARCHITECTURE.md → System design
2. Source code → Implementation details
3. _archived_docs/ → Historical context

---

## ✅ Checklist

### For New Team Members
- [ ] Read README.md
- [ ] Setup development environment
- [ ] Run application
- [ ] Test with COMPLETE_FLOW_GUIDE.md
- [ ] Import Postman collections
- [ ] Understand ORDER_FLOW_SIMPLIFIED.md

### For Developers
- [ ] Read API_ENDPOINTS_COMPLETE.md
- [ ] Test all endpoints with Postman
- [ ] Understand order flow
- [ ] Check ALL_FIXES_COMPLETE.md
- [ ] Review source code

---

## 📧 Feedback

Nếu tài liệu chưa rõ hoặc cần thêm thông tin, vui lòng:
1. Check _archived_docs/ xem có thông tin cũ không
2. Create issue
3. Update documentation accordingly

---

**Maintained by:** CNPM Team  
**Last Updated:** November 4, 2025  
**Version:** 2.0 (Cleaned & Organized)

