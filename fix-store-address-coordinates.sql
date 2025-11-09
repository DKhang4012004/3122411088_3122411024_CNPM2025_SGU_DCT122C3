-- =====================================================
-- FIX: Add Store Addresses with Coordinates
-- =====================================================

-- Kiểm tra stored procedure có tồn tại không
DROP PROCEDURE IF EXISTS GetActiveStoresWithinRadius;

-- Tạo stored procedure để tìm stores trong radius
DELIMITER $$
CREATE PROCEDURE GetActiveStoresWithinRadius(
    IN user_lat DOUBLE,
    IN user_lng DOUBLE
)
BEGIN
    SELECT 
        sa.*,
        s.name as store_name,
        (6371 * acos(
            cos(radians(user_lat)) * 
            cos(radians(sa.latitude)) * 
            cos(radians(sa.longitude) - radians(user_lng)) + 
            sin(radians(user_lat)) * 
            sin(radians(sa.latitude))
        )) AS distance_km
    FROM store_address sa
    INNER JOIN store s ON sa.store_id = s.id
    WHERE s.status = 'ACTIVE'
        AND sa.latitude IS NOT NULL 
        AND sa.longitude IS NOT NULL
    HAVING distance_km <= 10
    ORDER BY distance_km;
END$$
DELIMITER ;

-- Thêm hoặc update địa chỉ cho các stores với tọa độ gần vị trí user
-- User location: 10.78775, 106.703

-- Store 1: Nhà hàng Phở Hà Nội (cách user khoảng 2km)
INSERT INTO store_address (store_id, full_address, ward, district, city, country, latitude, longitude, is_default, created_at)
VALUES 
(1, '123 Đường Võ Văn Ngân, Linh Chiểu, Thủ Đức', 'Linh Chiểu', 'Thủ Đức', 'Hồ Chí Minh', 'Việt Nam', 10.78775, 106.703, 1, NOW())
ON DUPLICATE KEY UPDATE 
    latitude = VALUES(latitude),
    longitude = VALUES(longitude),
    full_address = VALUES(full_address);

-- Store 2: Quán Cơm Tấm Sài Gòn (cách user khoảng 3km)  
INSERT INTO store_address (store_id, full_address, ward, district, city, country, latitude, longitude, is_default, created_at)
VALUES
(2, '456 Đường Kha Vạn Cân, Linh Trung, Thủ Đức', 'Linh Trung', 'Thủ Đức', 'Hồ Chí Minh', 'Việt Nam', 10.79, 106.71, 1, NOW())
ON DUPLICATE KEY UPDATE
    latitude = VALUES(latitude),
    longitude = VALUES(longitude),
    full_address = VALUES(full_address);

-- Verify
SELECT 
    s.id,
    s.name,
    sa.full_address,
    sa.latitude,
    sa.longitude,
    (6371 * acos(
        cos(radians(10.78775)) * 
        cos(radians(sa.latitude)) * 
        cos(radians(sa.longitude) - radians(106.703)) + 
        sin(radians(10.78775)) * 
        sin(radians(sa.latitude))
    )) AS distance_km
FROM store s
LEFT JOIN store_address sa ON s.id = sa.store_id
WHERE s.id IN (1, 2);

-- Test stored procedure
CALL GetActiveStoresWithinRadius(10.78775, 106.703);
