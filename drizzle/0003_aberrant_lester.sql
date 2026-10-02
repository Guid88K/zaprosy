ALTER TABLE `invitations` ADD `locale` text DEFAULT 'uk' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `locale` text DEFAULT 'uk' NOT NULL;