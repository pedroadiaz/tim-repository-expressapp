-- Add layout and data storage to reports table
ALTER TABLE `gmrgfeoc_simplereports`.`report` 
ADD COLUMN `layout_data` JSON DEFAULT NULL,
ADD COLUMN `last_modified` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;