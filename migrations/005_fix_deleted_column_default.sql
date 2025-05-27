-- Fix deleted column to have proper default value
-- Update existing NULL values to 0 (not deleted)
UPDATE `gmrgfeoc_simplereports`.`report_entry` 
SET `deleted` = 0 WHERE `deleted` IS NULL;

-- Modify column to have default value of 0
ALTER TABLE `gmrgfeoc_simplereports`.`report_entry` 
MODIFY COLUMN `deleted` TINYINT(1) DEFAULT 0;