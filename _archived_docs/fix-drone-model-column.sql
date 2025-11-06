-- Fix the drone model column length
-- Run this SQL script in your MySQL database to fix the column size issue

USE drone_delivery;

-- Alter the model column to increase its length from VARCHAR(100) to VARCHAR(200)
ALTER TABLE drone MODIFY COLUMN model VARCHAR(200);

-- Verify the change
DESCRIBE drone;

