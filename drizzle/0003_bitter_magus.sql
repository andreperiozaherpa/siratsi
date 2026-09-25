CREATE TABLE `evidence_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `evidence_photos_object_key_unique` ON `evidence_photos` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_evidence_incident` ON `evidence_photos` (`incident_id`,`created_at`);