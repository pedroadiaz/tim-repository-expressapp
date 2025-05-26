-- Add account_locked and temp_password fields to the users table
ALTER TABLE `gmrgfeoc_simplereports`.`users` 
ADD COLUMN `account_locked` BOOLEAN DEFAULT FALSE,
ADD COLUMN `temp_password` VARCHAR(255) DEFAULT NULL,
ADD COLUMN `password_reset_token` VARCHAR(255) DEFAULT NULL,
ADD COLUMN `password_reset_expires` DATETIME DEFAULT NULL;