CREATE TABLE `approval_documents` (
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
CREATE UNIQUE INDEX `approval_documents_object_key_unique` ON `approval_documents` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_approval_documents_incident` ON `approval_documents` (`incident_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `approval_history` (
	`id` text PRIMARY KEY NOT NULL,
	`incident_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_approval_history_incident` ON `approval_history` (`incident_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `incident_approvals` (
	`incident_id` text PRIMARY KEY NOT NULL,
	`approver_id` text NOT NULL,
	`requested_by` text NOT NULL,
	`status` text NOT NULL,
	`submitted_at` text NOT NULL,
	`decided_at` text,
	`decision_note` text,
	FOREIGN KEY (`incident_id`) REFERENCES `incidents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
