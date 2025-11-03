-- ============================================
-- TEST DATA FOR COMPLETE ORDER FLOW
-- ============================================

-- 1. Insert test users (if not exists)
INSERT IGNORE INTO users (id, username, email, password_hash, full_name, phone, status, date_of_birth, gender, created_at, updated_at)
VALUES
(1, 'customer1', 'customer1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyễn Văn A', '0901234567', 'ACTIVE', '1990-01-01', 'MALE', NOW(), NOW()),
(2, 'store_owner1', 'owner1@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trần Thị B', '0907654321', 'ACTIVE', '1985-05-15', 'FEMALE', NOW(), NOW());

-- 2. Insert roles (if not exists)
INSERT IGNORE INTO roles (id, name) VALUES
(1, 'USER'),
(2, 'STORE_OWNER'),
(3, 'ADMIN');

-- 3. Assign roles to users
INSERT IGNORE INTO user_role (user_id, role_id) VALUES
(1, 1),  -- customer1 is USER
(2, 1),  -- store_owner1 is USER
(2, 2);  -- store_owner1 is also STORE_OWNER

-- 4. Insert product categories
INSERT IGNORE INTO product_category (id, name, description, status, created_at, updated_at)
VALUES
(1, 'Cơm', 'Các món cơm', 'ACTIVE', NOW(), NOW()),
(2, 'Phở', 'Các món phở', 'ACTIVE', NOW(), NOW()),
(3, 'Bún', 'Các món bún', 'ACTIVE', NOW(), NOW()),
(4, 'Đồ uống', 'Nước giải khát', 'ACTIVE', NOW(), NOW()),
(5, 'Tráng miệng', 'Món tráng miệng', 'ACTIVE', NOW(), NOW());

-- 5. Insert stores
INSERT IGNORE INTO store (id, owner_user_id, name, description, phone_number, email, logo_url, rating, status, created_at, updated_at)
VALUES
(1, 2, 'Cơm Tấm Sài Gòn', 'Cơm tấm truyền thống Sài Gòn, ngon bổ rẻ', '0901234567', 'comtam@saigon.com', NULL, 4.5, 'OPEN', NOW(), NOW()),
(2, 2, 'Phở Hà Nội', 'Phở Hà Nội chính gốc, nước dùng đậm đà', '0902345678', 'pho@hanoi.com', NULL, 4.7, 'OPEN', NOW(), NOW()),
(3, 2, 'Bún Bò Huế', 'Bún bò Huế chuẩn vị, cay nồng', '0903456789', 'bunbo@hue.com', NULL, 4.3, 'OPEN', NOW(), NOW());

-- 6. Insert store addresses
INSERT IGNORE INTO store_address (id, store_id, street, district, city, latitude, longitude, full_address, created_at, updated_at)
VALUES
(1, 1, '123 Nguyễn Văn Linh', 'Quận 7', 'TP. Hồ Chí Minh', 10.762622, 106.660172, '123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh', NOW(), NOW()),
(2, 2, '456 Lê Lợi', 'Quận 1', 'TP. Hồ Chí Minh', 10.762800, 106.660300, '456 Lê Lợi, Quận 1, TP. Hồ Chí Minh', NOW(), NOW()),
(3, 3, '789 Võ Văn Tần', 'Quận 3', 'TP. Hồ Chí Minh', 10.763000, 106.660500, '789 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh', NOW(), NOW());

-- 7. Insert products for Store 1 (Cơm Tấm Sài Gòn)
INSERT IGNORE INTO product (id, store_id, category_id, sku, name, description, base_price, currency, weight_gram, quantity_available, status, created_at, updated_at)
VALUES
(101, 1, 1, 'CT-SUON-001', 'Cơm Tấm Sườn Bì Chả', 'Sườn nướng, bì, chả trứng, đầy đủ', 45000, 'VND', 500, 50, 'ACTIVE', NOW(), NOW()),
(102, 1, 1, 'CT-SUON-002', 'Cơm Tấm Sườn', 'Sườn nướng thơm ngon', 35000, 'VND', 400, 50, 'ACTIVE', NOW(), NOW()),
(103, 1, 1, 'CT-BI-001', 'Cơm Tấm Bì', 'Bì giòn rụm', 30000, 'VND', 350, 50, 'ACTIVE', NOW(), NOW()),
(104, 1, 1, 'CT-CHA-001', 'Cơm Tấm Chả', 'Chả trứng thơm phức', 28000, 'VND', 350, 50, 'ACTIVE', NOW(), NOW()),
(105, 1, 4, 'NUOC-001', 'Nước ngọt Coca', 'Coca Cola lon 330ml', 12000, 'VND', 330, 100, 'ACTIVE', NOW(), NOW());

-- 8. Insert products for Store 2 (Phở Hà Nội)
INSERT IGNORE INTO product (id, store_id, category_id, sku, name, description, base_price, currency, weight_gram, quantity_available, status, created_at, updated_at)
VALUES
(201, 2, 2, 'PHO-BO-001', 'Phở Bò Tái', 'Phở bò tái nạm gân', 50000, 'VND', 600, 40, 'ACTIVE', NOW(), NOW()),
(202, 2, 2, 'PHO-BO-002', 'Phở Bò Chín', 'Phở bò chín đầy đặn', 45000, 'VND', 600, 40, 'ACTIVE', NOW(), NOW()),
(203, 2, 2, 'PHO-GA-001', 'Phở Gà', 'Phở gà thơm ngon', 42000, 'VND', 550, 40, 'ACTIVE', NOW(), NOW()),
(204, 2, 4, 'TRA-001', 'Trà đá', 'Trà đá miễn phí', 0, 'VND', 200, 200, 'ACTIVE', NOW(), NOW());

-- 9. Insert products for Store 3 (Bún Bò Huế)
INSERT IGNORE INTO product (id, store_id, category_id, sku, name, description, base_price, currency, weight_gram, quantity_available, status, created_at, updated_at)
VALUES
(301, 3, 3, 'BBH-001', 'Bún Bò Huế Đặc Biệt', 'Bún bò Huế đầy đủ topping', 55000, 'VND', 650, 35, 'ACTIVE', NOW(), NOW()),
(302, 3, 3, 'BBH-002', 'Bún Bò Huế Thường', 'Bún bò Huế cơ bản', 45000, 'VND', 550, 35, 'ACTIVE', NOW(), NOW()),
(303, 3, 4, 'NUOC-002', 'Nước suối', 'Nước suối Lavie 500ml', 8000, 'VND', 500, 150, 'ACTIVE', NOW(), NOW());

-- 10. Insert user addresses for customer
INSERT IGNORE INTO user_address (id, user_id, label, street, district, city, latitude, longitude, full_address, is_default, created_at, updated_at)
VALUES
(1, 1, 'Nhà riêng', '789 Nguyễn Thị Minh Khai', 'Quận 3', 'TP. Hồ Chí Minh', 10.773622, 106.670172, '789 Nguyễn Thị Minh Khai, Quận 3, TP.HCM', 1, NOW(), NOW()),
(2, 1, 'Văn phòng', '101 Lê Văn Việt', 'Quận 9', 'TP. Hồ Chí Minh', 10.850000, 106.780000, '101 Lê Văn Việt, Quận 9, TP.HCM', 0, NOW(), NOW());

-- 11. Create a test cart for customer
INSERT IGNORE INTO cart (id, user_id, status, created_at, updated_at)
VALUES (1, 1, 'ACTIVE', NOW(), NOW());

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check inserted data
SELECT '=== USERS ===' as '';
SELECT id, username, email, full_name, status FROM users;

SELECT '=== STORES ===' as '';
SELECT id, name, status, rating FROM store;

SELECT '=== PRODUCTS ===' as '';
SELECT p.id, s.name as store_name, p.name as product_name, p.base_price, p.quantity_available, p.status
FROM product p
JOIN store s ON p.store_id = s.id
ORDER BY s.id, p.id;

SELECT '=== USER ADDRESSES ===' as '';
SELECT id, user_id, label, full_address, is_default FROM user_address;

SELECT '=== READY TO TEST ===' as '';
SELECT 'All test data inserted successfully!' as message;
SELECT CONCAT('Total Stores: ', COUNT(*)) as info FROM store;
SELECT CONCAT('Total Products: ', COUNT(*)) as info FROM product;
SELECT CONCAT('Total Users: ', COUNT(*)) as info FROM users;

-- ============================================
-- NOTES
-- ============================================
-- Password for all test users: "password123"
-- Use these credentials to login:
-- - customer1 / password123 (USER role)
-- - store_owner1 / password123 (STORE_OWNER role)
--
-- Store locations (pickup points):
-- - Store 1: 10.762622, 106.660172
-- - Store 2: 10.762800, 106.660300
-- - Store 3: 10.763000, 106.660500
--
-- Customer address (dropoff point):
-- - Address 1: 10.773622, 106.670172 (default)
--
-- Distance from Store 1 to Customer: ~1.5 km
-- ============================================

