-- Migration to add expiration notification types
-- Run this SQL to update the notification types enum

ALTER TABLE notifications 
MODIFY COLUMN type ENUM('low_stock', 'out_of_stock', 'sale_new', 'purchase_new', 'expiring_soon', 'expiring_today', 'expired') NOT NULL;