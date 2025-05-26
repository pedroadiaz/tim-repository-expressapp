-- Add Stripe subscription fields to the users table
ALTER TABLE `gmrgfeoc_simplereports`.`users` 
ADD COLUMN `stripe_customer_id` VARCHAR(255) DEFAULT NULL,
ADD COLUMN `stripe_subscription_id` VARCHAR(255) DEFAULT NULL,
ADD COLUMN `trial_end_date` DATETIME DEFAULT NULL,
ADD COLUMN `trial_days` INT DEFAULT 15,
ADD COLUMN `is_paid` BOOLEAN DEFAULT FALSE,
ADD COLUMN `last_reminder_date` DATE DEFAULT NULL,
ADD COLUMN `unlimited_access` BOOLEAN DEFAULT FALSE;