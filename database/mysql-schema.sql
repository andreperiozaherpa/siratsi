CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR(64) PRIMARY KEY, created_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL,
  stage INT NOT NULL DEFAULT 0, reporter VARCHAR(150) NOT NULL, contact VARCHAR(100) NOT NULL,
  description VARCHAR(4000) NOT NULL, location VARCHAR(250) NOT NULL, category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'Sedang', data TEXT NOT NULL,
  INDEX idx_incidents_updated_at (updated_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historical_incidents (
  incident_id VARCHAR(64) PRIMARY KEY, first_recorded_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL,
  current_stage INT NOT NULL, reporter VARCHAR(150) NOT NULL, contact VARCHAR(100) NOT NULL,
  description VARCHAR(4000) NOT NULL, location VARCHAR(250) NOT NULL, category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL, case_status VARCHAR(80) NOT NULL DEFAULT '', verification_status VARCHAR(80) NOT NULL DEFAULT '',
  source VARCHAR(80) NOT NULL DEFAULT 'SIRATSI', incident_data LONGTEXT NOT NULL,
  INDEX idx_historical_incidents_updated (updated_at), INDEX idx_historical_incidents_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE, name VARCHAR(150) NOT NULL,
  role VARCHAR(32) NOT NULL, organization VARCHAR(150) NOT NULL, job_title VARCHAR(150) NOT NULL DEFAULT '', profile_photo_key VARCHAR(255), auth_user_id VARCHAR(255) UNIQUE,
  active INT NOT NULL DEFAULT 1, created_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stakeholder_directory (
  id VARCHAR(36) PRIMARY KEY, name VARCHAR(150) NOT NULL, kind VARCHAR(16) NOT NULL,
  detail VARCHAR(500) NOT NULL DEFAULT '', active INT NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL,
  UNIQUE KEY uq_stakeholder_directory_name_kind (name, kind),
  INDEX idx_stakeholder_directory_active (active, kind, name)
) ENGINE=InnoDB;

INSERT IGNORE INTO stakeholder_directory (id,name,kind,detail,active,created_at,updated_at) VALUES
('a2e070c1-6523-4dce-8d11-000000000001','Direktur Polairud','internal','Pengarah / pengendali umum',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000002','Wadir Polairud','internal','Koordinator pelaksanaan',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000003','Subbagrenmin','internal','Administrasi dan logistik',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000004','Kabagbinops','internal','Operasional dan pengendalian',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000005','Kabagdal','internal','Pemantauan dan pengawasan',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000006','Kabaglog','internal','Dukungan sarana prasarana',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000007','Sat Polairud Polres Jajaran','internal','Pelaksanaan lapangan',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000008','DKP','external','Data perikanan dan kebijakan',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000009','PSDKP','external','Pengawasan sumber daya kelautan',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000010','TNI AL','external','Dukungan operasi dan keamanan laut',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000011','Basarnas','external','Operasi pencarian dan pertolongan',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000012','KSOP','external','Lalu lintas dan keselamatan kapal',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000013','KPLP','external','Pengawasan pelayaran',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000014','Bea Cukai','external','Pengawasan barang',1,UTC_TIMESTAMP(),UTC_TIMESTAMP()),
('a2e070c1-6523-4dce-8d11-000000000015','Pemerintah Daerah','external','Koordinasi wilayah',1,UTC_TIMESTAMP(),UTC_TIMESTAMP());

CREATE TABLE IF NOT EXISTS user_stakeholders (
  user_id VARCHAR(36) NOT NULL, stakeholder_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (user_id, stakeholder_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stakeholder_id) REFERENCES stakeholder_directory(id) ON DELETE CASCADE,
  INDEX idx_user_stakeholders_stakeholder (stakeholder_id, user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incident_stakeholders (
  incident_id VARCHAR(64) NOT NULL, organization VARCHAR(150) NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id), INDEX idx_incident_stakeholders_org (organization, incident_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stakeholder_updates (
  id VARCHAR(36) PRIMARY KEY, incident_id VARCHAR(64) NOT NULL, user_id VARCHAR(36) NOT NULL,
  organization VARCHAR(150) NOT NULL, note VARCHAR(4000) NOT NULL, created_at VARCHAR(32) NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id), FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_stakeholder_updates_incident (incident_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS evidence_photos (
  id VARCHAR(36) PRIMARY KEY, incident_id VARCHAR(64) NOT NULL, object_key VARCHAR(255) NOT NULL UNIQUE,
  filename VARCHAR(180) NOT NULL, content_type VARCHAR(100) NOT NULL, size_bytes INT NOT NULL,
  uploaded_by VARCHAR(36) NOT NULL, created_at VARCHAR(32) NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id), FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_evidence_incident (incident_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS verification_evidence (
  id VARCHAR(36) PRIMARY KEY, incident_id VARCHAR(64) NOT NULL, object_key VARCHAR(255) NOT NULL UNIQUE,
  filename VARCHAR(180) NOT NULL, content_type VARCHAR(100) NOT NULL, size_bytes INT NOT NULL,
  uploaded_by VARCHAR(36) NOT NULL, created_at VARCHAR(32) NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id), FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_verification_evidence_incident (incident_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS execution_evidence (
  id VARCHAR(36) PRIMARY KEY, incident_id VARCHAR(64) NOT NULL, object_key VARCHAR(255) NOT NULL UNIQUE,
  filename VARCHAR(180) NOT NULL, content_type VARCHAR(100) NOT NULL, size_bytes INT NOT NULL,
  uploaded_by VARCHAR(36) NOT NULL, created_at VARCHAR(32) NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id), FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_execution_evidence_incident (incident_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_credentials (
  user_id VARCHAR(36) PRIMARY KEY, password_hash VARCHAR(255) NOT NULL, failed_attempts INT NOT NULL DEFAULT 0,
  locked_until VARCHAR(32), updated_at VARCHAR(32) NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_sessions (
  token_hash VARCHAR(64) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, expires_at VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_password_sessions_user (user_id), INDEX idx_password_sessions_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_reads (
  user_id VARCHAR(36) NOT NULL, incident_id VARCHAR(64) NOT NULL, last_seen_updated_at VARCHAR(32) NOT NULL,
  PRIMARY KEY (user_id, incident_id), FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (incident_id) REFERENCES incidents(id), INDEX idx_notification_reads_incident (incident_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stakeholder_documents (
  id VARCHAR(36) PRIMARY KEY, incident_id VARCHAR(64) NOT NULL, object_key VARCHAR(255) NOT NULL UNIQUE,
  filename VARCHAR(180) NOT NULL, content_type VARCHAR(100) NOT NULL, size_bytes INT NOT NULL,
  uploaded_by VARCHAR(36) NOT NULL, created_at VARCHAR(32) NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id), FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_stakeholder_documents_incident (incident_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incident_approvals (
  incident_id VARCHAR(64) PRIMARY KEY, approver_id VARCHAR(36) NOT NULL, requested_by VARCHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL, submitted_at VARCHAR(32) NOT NULL, decided_at VARCHAR(32), decision_note VARCHAR(500),
  FOREIGN KEY (incident_id) REFERENCES incidents(id), FOREIGN KEY (approver_id) REFERENCES users(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS approval_history (
  id VARCHAR(36) PRIMARY KEY, incident_id VARCHAR(64) NOT NULL, actor_id VARCHAR(36) NOT NULL,
  action VARCHAR(100) NOT NULL, note VARCHAR(500) NOT NULL DEFAULT '', created_at VARCHAR(32) NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id), FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX idx_approval_history_incident (incident_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS approval_documents (
  id VARCHAR(36) PRIMARY KEY, incident_id VARCHAR(64) NOT NULL, object_key VARCHAR(255) NOT NULL UNIQUE,
  filename VARCHAR(180) NOT NULL, content_type VARCHAR(100) NOT NULL, size_bytes INT NOT NULL,
  uploaded_by VARCHAR(36) NOT NULL, created_at VARCHAR(32) NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id), FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_approval_documents_incident (incident_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY, incident_id VARCHAR(64) NOT NULL, actor_id VARCHAR(36) NOT NULL,
  action VARCHAR(120) NOT NULL, detail VARCHAR(2000) NOT NULL DEFAULT '', created_at VARCHAR(32) NOT NULL,
  FOREIGN KEY (incident_id) REFERENCES incidents(id), FOREIGN KEY (actor_id) REFERENCES users(id),
  INDEX idx_audit_logs_incident (incident_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incident_escalations (
  id VARCHAR(36) PRIMARY KEY, incident_id VARCHAR(64) NOT NULL, raised_by VARCHAR(36) NOT NULL,
  reason VARCHAR(2000) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'active', created_at VARCHAR(32) NOT NULL,
  automatic INT NOT NULL DEFAULT 0, resolved_at VARCHAR(32), resolved_by VARCHAR(36), resolution_note VARCHAR(2000) NOT NULL DEFAULT '',
  FOREIGN KEY (incident_id) REFERENCES incidents(id), FOREIGN KEY (raised_by) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id),
  INDEX idx_incident_escalations_active (status, created_at), INDEX idx_incident_escalations_incident (incident_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incident_escalation_recipients (
  escalation_id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, read_at VARCHAR(32),
  PRIMARY KEY (escalation_id, user_id), FOREIGN KEY (escalation_id) REFERENCES incident_escalations(id),
  FOREIGN KEY (user_id) REFERENCES users(id), INDEX idx_escalation_recipients_user (user_id, read_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS incident_handoffs (
  id VARCHAR(36) PRIMARY KEY, incident_id VARCHAR(64) NOT NULL, assigned_to VARCHAR(150) NOT NULL,
  raised_by VARCHAR(36) NOT NULL, reason VARCHAR(2000) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at VARCHAR(32) NOT NULL, resolved_at VARCHAR(32),
  FOREIGN KEY (incident_id) REFERENCES incidents(id), FOREIGN KEY (raised_by) REFERENCES users(id),
  INDEX idx_incident_handoffs_active (status, created_at), INDEX idx_incident_handoffs_incident (incident_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sop_documents (
  id VARCHAR(36) PRIMARY KEY, title VARCHAR(250) NOT NULL, category VARCHAR(100) NOT NULL,
  version VARCHAR(80) NOT NULL, reference_url VARCHAR(1000) NOT NULL DEFAULT '', status VARCHAR(20) NOT NULL DEFAULT 'active',
  notes VARCHAR(2000) NOT NULL DEFAULT '', created_by VARCHAR(36) NOT NULL, created_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id), INDEX idx_sop_documents_status (status, category)
) ENGINE=InnoDB;
