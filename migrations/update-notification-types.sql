-- Update Notification Types to include sale_new and purchase_new
-- Run this SQL script in MySQL to update the notification types

USE inventory_db;

-- Check current ENUM values
SHOW COLUMNS FROM notifications LIKE 'type';

-- Modify the type column to include new values
ALTER TABLE notifications 
MODIFY COLUMN type ENUM('low_stock', 'out_of_stock', 'sale_new', 'purchase_new') NOT NULL;

-- Verify the change
SHOW COLUMNS FROM notifications LIKE 'type';

SELECT 'Notification types updated successfully!' as status;
