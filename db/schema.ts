import { index, int, mysqlTable, primaryKey, text, varchar } from 'drizzle-orm/mysql-core';

const value = (name: string, length = 255) => varchar(name, { length });

export const incidents = mysqlTable('incidents', {
  id: value('id', 64).primaryKey(),
  createdAt: value('created_at', 32).notNull(),
  updatedAt: value('updated_at', 32).notNull(),
  stage: int('stage').notNull().default(0),
  reporter: value('reporter', 150).notNull(),
  contact: value('contact', 100).notNull(),
  description: value('description', 4000).notNull(),
  location: value('location', 250).notNull(),
  category: value('category', 100).notNull(),
  priority: value('priority', 20).notNull().default('Sedang'),
  data: text('data').notNull().default('{}'),
}, (table) => [index('idx_incidents_updated_at').on(table.updatedAt)]);

export const users = mysqlTable('users', {
  id: value('id', 36).primaryKey(), email: value('email', 254).notNull().unique(), name: value('name', 150).notNull(), role: value('role', 32).notNull(), organization: value('organization', 150).notNull(), authUserId: value('auth_user_id', 255).unique(), active: int('active').notNull().default(1), createdAt: value('created_at', 32).notNull(), updatedAt: value('updated_at', 32).notNull(),
});

export const incidentStakeholders = mysqlTable('incident_stakeholders', {
  incidentId: value('incident_id', 64).notNull().references(() => incidents.id), organization: value('organization', 150).notNull(),
}, (table) => [index('idx_incident_stakeholders_org').on(table.organization, table.incidentId)]);

export const stakeholderUpdates = mysqlTable('stakeholder_updates', {
  id: value('id', 36).primaryKey(), incidentId: value('incident_id', 64).notNull().references(() => incidents.id), userId: value('user_id', 36).notNull().references(() => users.id), organization: value('organization', 150).notNull(), note: value('note', 4000).notNull(), createdAt: value('created_at', 32).notNull(),
}, (table) => [index('idx_stakeholder_updates_incident').on(table.incidentId, table.createdAt)]);

export const evidencePhotos = mysqlTable('evidence_photos', {
  id: value('id', 36).primaryKey(), incidentId: value('incident_id', 64).notNull().references(() => incidents.id), objectKey: value('object_key', 255).notNull().unique(), filename: value('filename', 180).notNull(), contentType: value('content_type', 100).notNull(), sizeBytes: int('size_bytes').notNull(), uploadedBy: value('uploaded_by', 36).notNull().references(() => users.id), createdAt: value('created_at', 32).notNull(),
}, (table) => [index('idx_evidence_incident').on(table.incidentId, table.createdAt)]);

export const passwordCredentials = mysqlTable('password_credentials', {
  userId: value('user_id', 36).primaryKey().references(() => users.id), passwordHash: value('password_hash', 255).notNull(), failedAttempts: int('failed_attempts').notNull().default(0), lockedUntil: value('locked_until', 32), updatedAt: value('updated_at', 32).notNull(),
});

export const passwordSessions = mysqlTable('password_sessions', {
  tokenHash: value('token_hash', 64).primaryKey(), userId: value('user_id', 36).notNull().references(() => users.id), expiresAt: value('expires_at', 32).notNull(), createdAt: value('created_at', 32).notNull(),
}, (table) => [index('idx_password_sessions_user').on(table.userId), index('idx_password_sessions_expires').on(table.expiresAt)]);

export const notificationReads = mysqlTable('notification_reads', {
  userId: value('user_id', 36).notNull().references(() => users.id), incidentId: value('incident_id', 64).notNull().references(() => incidents.id), lastSeenUpdatedAt: value('last_seen_updated_at', 32).notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.incidentId] }), index('idx_notification_reads_incident').on(table.incidentId)]);

export const stakeholderDocuments = mysqlTable('stakeholder_documents', {
  id: value('id', 36).primaryKey(), incidentId: value('incident_id', 64).notNull().references(() => incidents.id), objectKey: value('object_key', 255).notNull().unique(), filename: value('filename', 180).notNull(), contentType: value('content_type', 100).notNull(), sizeBytes: int('size_bytes').notNull(), uploadedBy: value('uploaded_by', 36).notNull().references(() => users.id), createdAt: value('created_at', 32).notNull(),
}, (table) => [index('idx_stakeholder_documents_incident').on(table.incidentId, table.createdAt)]);

export const incidentApprovals = mysqlTable('incident_approvals', {
  incidentId: value('incident_id', 64).primaryKey().references(() => incidents.id), approverId: value('approver_id', 36).notNull().references(() => users.id), requestedBy: value('requested_by', 36).notNull().references(() => users.id), status: value('status', 20).notNull(), submittedAt: value('submitted_at', 32).notNull(), decidedAt: value('decided_at', 32), decisionNote: value('decision_note', 500),
});

export const approvalHistory = mysqlTable('approval_history', {
  id: value('id', 36).primaryKey(), incidentId: value('incident_id', 64).notNull().references(() => incidents.id), actorId: value('actor_id', 36).notNull().references(() => users.id), action: value('action', 100).notNull(), note: value('note', 500).notNull().default(''), createdAt: value('created_at', 32).notNull(),
}, (table) => [index('idx_approval_history_incident').on(table.incidentId, table.createdAt)]);

export const approvalDocuments = mysqlTable('approval_documents', {
  id: value('id', 36).primaryKey(), incidentId: value('incident_id', 64).notNull().references(() => incidents.id), objectKey: value('object_key', 255).notNull().unique(), filename: value('filename', 180).notNull(), contentType: value('content_type', 100).notNull(), sizeBytes: int('size_bytes').notNull(), uploadedBy: value('uploaded_by', 36).notNull().references(() => users.id), createdAt: value('created_at', 32).notNull(),
}, (table) => [index('idx_approval_documents_incident').on(table.incidentId, table.createdAt)]);
