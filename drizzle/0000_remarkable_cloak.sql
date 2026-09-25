CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`stage` integer DEFAULT 0 NOT NULL,
	`reporter` text NOT NULL,
	`contact` text NOT NULL,
	`description` text NOT NULL,
	`location` text NOT NULL,
	`category` text NOT NULL,
	`priority` text DEFAULT 'Sedang' NOT NULL,
	`data` text DEFAULT '{}' NOT NULL
);
