CREATE TABLE `notification_reads` (
	`user_id` text NOT NULL,
	`incident_id` text NOT NULL,
	`last_seen_updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `incident_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_notification_reads_incident` ON `notification_reads` (`incident_id`);