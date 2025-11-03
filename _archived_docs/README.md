# 📦 Archived Documentation

Các tài liệu cũ đã được lưu trữ tại đây để giữ project root gọn gàng.

---

## ℹ️ About

Folder này chứa:
- ✅ Old documentation files
- ✅ Historical fixes
- ✅ Deprecated guides
- ✅ Old test scripts

**Status:** Archived (Not actively maintained)

---

## 📁 Contents

### Fix Documentation (23 files)
Files starting with `FIX_*` - Bug fixes and solutions

### Guide Documentation (4 files)
- `GUIDE_TEST_FULL_FLOW.md`
- `COMPLETE_TEST_FLOW.md`
- `HUONG_DAN_FIX_CUOI_CUNG.md`
- `PAYMENT_FIX_GUIDE.md`

### Final/Complete Documentation (3 files)
- `FINAL_COMPLETE_SUMMARY.md`
- `FINAL_FIX_AUTH_PATH.md`
- `AUTO_MIGRATION_FINAL.md`

### Configuration Fixes (3 files)
- `FIXED_WEBMVC_CONFIG.md`
- `CONTEXT_PATH_FIXED.md`
- `CONSOLE_FIX_SCRIPT.md`

### Test Scripts (4 BAT files)
- `test-drone-flow.bat`
- `test-order-flow.bat`
- `test-payment-fix.bat`
- `test-store-products.bat`

### SQL Patches (2 files)
- `add_vnp_txn_ref_column.sql`
- `fix-drone-model-column.sql`

### Other (1 file)
- `restart-ngrok.bat`

---

## 🔍 Why Archived?

### Reasons for archiving:
1. **Outdated** - Information superseded by newer docs
2. **Duplicate** - Content merged into main documentation
3. **Historical** - Keep for reference but not needed daily
4. **Cleanup** - Reduce clutter in project root

### What replaced them:
- **README.md** - Main comprehensive guide
- **COMPLETE_FLOW_GUIDE.md** - Test guide (latest)
- **ORDER_FLOW_SIMPLIFIED.md** - Current order flow
- **ALL_FIXES_COMPLETE.md** - Summary of all fixes

---

## 📊 Statistics

| Type | Count |
|------|-------|
| Markdown (.md) | 27 |
| Batch scripts (.bat) | 4 |
| SQL scripts (.sql) | 2 |
| **Total** | **33** |

---

## 🔎 How to Use

### If you need to:

**1. Reference old fixes**
→ Search FIX_*.md files

**2. Understand historical changes**
→ Read FINAL_*.md, AUTO_*.md files

**3. See old test scripts**
→ Check test-*.bat files

**4. Apply old SQL patches**
→ Use .sql files (be careful!)

---

## ⚠️ Important Notes

### Before using archived files:

1. **Check main docs first** - Solution might be in current documentation
2. **Verify compatibility** - Old fixes may not work with current code
3. **Test carefully** - Some fixes were superseded by better solutions
4. **Ask team** - Confirm if old approach is still valid

### Do NOT:
- ❌ Run old BAT scripts without reviewing
- ❌ Apply SQL patches blindly
- ❌ Follow old guides without checking current docs
- ❌ Restore archived files to root without reason

---

## 📚 Reference Map

### If you're looking for:

| Old File | Current Alternative |
|----------|---------------------|
| FIX_* files | ALL_FIXES_COMPLETE.md |
| GUIDE_* files | COMPLETE_FLOW_GUIDE.md |
| FINAL_* files | README.md |
| test-*.bat files | Manual testing via UI |
| HUONG_DAN_* | README.md (Vietnamese) |

---

## 🗂️ Archive Organization

```
_archived_docs/
├── FIX_*.md                    (Bug fixes - 23 files)
├── GUIDE_*.md                  (Old guides - 4 files)
├── FINAL_*.md                  (Final summaries - 3 files)
├── test-*.bat                  (Test scripts - 4 files)
├── *.sql                       (SQL patches - 2 files)
└── README.md                   (This file)
```

---

## 🔄 Restore Policy

### If you need to restore a file:

1. **Check with team** - Why is it needed?
2. **Review content** - Is it still relevant?
3. **Update if needed** - Don't restore outdated info
4. **Document reason** - Why restored?

### To restore:
```bash
# From _archived_docs to root
Move-Item -Path "_archived_docs/FILENAME.md" -Destination "./"
```

---

## 🧹 Maintenance

### This folder:
- ✅ Can be deleted if space needed (after backup)
- ✅ Can be compressed/zipped
- ✅ Can be moved to separate archive storage
- ✅ Review periodically and remove truly obsolete files

### Keep if:
- Contains unique historical information
- Needed for reference
- Part of project history

### Can delete if:
- Completely superseded
- No historical value
- Takes too much space

---

## 📅 Archive Date

**Archived:** November 4, 2025  
**Archived by:** CNPM Team  
**Reason:** Project cleanup & organization

---

## 📞 Questions?

If you need information from archived files:
1. Check main documentation first
2. Search this folder
3. Ask team if clarification needed

**Do not** restore files without discussion.

---

**Status:** 📦 Archived  
**Total Files:** 33  
**Maintained:** No (reference only)

