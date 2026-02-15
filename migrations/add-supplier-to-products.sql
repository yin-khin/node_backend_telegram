-- Add supplier_id column to products table
-- This migration adds the supplier_id foreign key to the products table

-- Add the supplier_id column
ALTER TABLE products 
ADD COLUMN supplier_id INT NOT NULL DEFAULT 1;

-- Add foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT fk_products_supplier 
FOREIGN KEY (supplier_id) REFERENCES supplier(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add index for better performance
CREATE INDEX idx_products_supplier_id ON products(supplier_id);

-- Note: Default value of 1 assumes there's at least one supplier with id=1
-- You may need to adjust this based on your existing data