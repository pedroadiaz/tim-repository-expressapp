-- Add EULA acceptance tracking to users table
ALTER TABLE `gmrgfeoc_simplereports`.`users` 
ADD COLUMN `eula_accepted` BOOLEAN DEFAULT FALSE,
ADD COLUMN `eula_accepted_date` DATETIME DEFAULT NULL;