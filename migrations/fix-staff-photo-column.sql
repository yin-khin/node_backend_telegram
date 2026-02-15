-- Fix staff photo column to support large base64 images
-- Run this SQL script in your MySQL database

USE inventory_db;

-- Alter the photo column to LONGTEXT to support large base64 images
ALTER TABLE staffs 
MODIFY COLUMN photo LONGTEXT;

-- Verify the change
DESCRIBE staffs;
