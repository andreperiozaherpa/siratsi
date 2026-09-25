CREATE TABLE `stakeholder_documents` (
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
CREATE UNIQUE INDEX `stakeholder_documents_object_key_unique` ON `stakeholder_documents` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_stakeholder_documents_incident` ON `stakeholder_documents` (`incident_id`,`created_at`);