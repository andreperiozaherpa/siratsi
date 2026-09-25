-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: lerd-mysql
-- Generation Time: Sep 25, 2026 at 07:00 PM
-- Server version: 8.4.11
-- PHP Version: 8.3.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `siratsi`
--

-- --------------------------------------------------------

--
-- Table structure for table `approval_documents`
--

CREATE TABLE `approval_documents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `object_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` int NOT NULL,
  `uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `approval_documents`
--

INSERT INTO `approval_documents` (`id`, `incident_id`, `object_key`, `filename`, `content_type`, `size_bytes`, `uploaded_by`, `created_at`) VALUES
('3f17a653-aa00-4d8b-8477-be8a63f5605a', 'INF-2026-67E9B4E6', 'approval-documents/INF-2026-67E9B4E6/3f17a653-aa00-4d8b-8477-be8a63f5605a', 'A4 - 1.pdf', 'application/pdf', 5370, '147c80a2-5d39-423e-9549-2afa8ff11359', '2026-09-25T12:41:11.185Z'),
('582a4316-5156-4cc9-95bf-35dfb2698f36', 'INF-2026-A0672334', 'approval-documents/INF-2026-A0672334/582a4316-5156-4cc9-95bf-35dfb2698f36', 'GUbernur Mirza.jpeg', 'image/jpeg', 42927, '147c80a2-5d39-423e-9549-2afa8ff11359', '2026-09-25T18:42:33.030Z');

-- --------------------------------------------------------

--
-- Table structure for table `approval_history`
--

CREATE TABLE `approval_history` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `approval_history`
--

INSERT INTO `approval_history` (`id`, `incident_id`, `actor_id`, `action`, `note`, `created_at`) VALUES
('270673ba-eb01-4bd8-aca0-263ede6e5d0c', 'INF-2026-A0672334', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Diajukan', '', '2026-09-25T18:42:36.966Z'),
('6b70d67a-0dd7-4c17-867f-e3a6ce5e5baa', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Diajukan', '', '2026-09-25T12:41:58.081Z'),
('d570154f-fc16-4547-82d6-0fa59cb6dc9b', 'INF-2026-A0672334', 'bb64de1b-d80c-4f28-bcd3-b63e4779a16a', 'Disetujui', 'tindak lanjuti laporan', '2026-09-25T18:44:05.813Z'),
('ed8df0a6-1a2a-49d9-8bb5-e1a578efc6ca', 'INF-2026-67E9B4E6', 'bb64de1b-d80c-4f28-bcd3-b63e4779a16a', 'Disetujui', '', '2026-09-25T12:43:18.261Z');

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `incident_id`, `actor_id`, `action`, `detail`, `created_at`) VALUES
('05d53e25-bf8d-4e83-9aba-1c83375411af', 'INF-2026-A0672334', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 7', '', '2026-09-25T18:52:23.817Z'),
('1126b846-91a5-4cb5-bc3f-3991d8a4554b', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Respons diajukan', '', '2026-09-25T12:41:58.093Z'),
('264f1ba8-8240-4a75-860e-b004d33cd04f', 'INF-2026-A0672334', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 1', '', '2026-09-25T18:17:19.728Z'),
('473cfad9-7bda-4672-b32f-de4cd3a667d3', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Eskalasi tindak lanjut', '', '2026-09-25T17:04:13.385Z'),
('517aa993-70f8-4386-be04-028821532ba8', 'INF-2026-67E9B4E6', 'ba2b64af-6d4c-4efe-9ade-8e012d92a57b', 'Tahap dilanjutkan ke 5', '', '2026-09-25T14:17:57.253Z'),
('5ce28d13-fc1f-4b21-a5d5-61719ce22e3c', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 6', '', '2026-09-25T17:05:03.714Z'),
('5d8dd621-bf8c-4230-bef0-e8d0c32d8533', 'INF-2026-A0672334', 'bb64de1b-d80c-4f28-bcd3-b63e4779a16a', 'Respons disetujui', 'tindak lanjuti laporan', '2026-09-25T18:44:05.819Z'),
('6134df18-0acd-4295-b952-4f0d49a5d2ca', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Verifikasi: Perlu dilengkapi', 'irawan', '2026-09-25T11:47:20.966Z'),
('7eba93b7-ec9c-4f47-988c-4e8ff72d7b4e', 'INF-2026-A0672334', 'ba2b64af-6d4c-4efe-9ade-8e012d92a57b', 'Tahap dilanjutkan ke 5', '', '2026-09-25T18:50:04.169Z'),
('88682b24-3356-4d68-81d5-dc766648c8cb', 'INF-2026-A0672334', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Informasi diterima', 'Kasus baru dicatat untuk verifikasi.', '2026-09-25T11:29:43.336Z'),
('8d55d9f1-1c16-4334-b695-69d450a7c203', 'INF-2026-67E9B4E6', 'bb64de1b-d80c-4f28-bcd3-b63e4779a16a', 'Respons disetujui', '', '2026-09-25T12:43:18.266Z'),
('996de195-fa8d-44b9-9a7f-ddad2a069a06', 'INF-2026-A0672334', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Respons diajukan', '', '2026-09-25T18:42:36.971Z'),
('99e32543-27ba-46f0-95b8-c28244117292', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 7', '', '2026-09-25T17:17:58.776Z'),
('9ba59e0d-94e2-4b4e-a22e-b770eb763bb8', 'INF-2026-A0672334', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 3', '', '2026-09-25T18:20:40.757Z'),
('a7b64373-b2f0-46ed-b31e-b3919441cb9c', 'INF-2026-67E9B4E6', 'ba2b64af-6d4c-4efe-9ade-8e012d92a57b', 'Draf diperbarui', '', '2026-09-25T14:16:33.243Z'),
('b1df676c-cde9-4a5e-bfc3-b41c7981dfe2', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Informasi diterima', 'Kasus baru dicatat untuk verifikasi.', '2026-09-25T11:33:48.848Z'),
('b7fe1e01-0ca9-4d14-9cc3-b0f9fb4c810f', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 7', '', '2026-09-25T17:12:56.352Z'),
('c0fe5fd8-1707-428d-a018-5fa08a50a2d1', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 2', '', '2026-09-25T12:13:10.448Z'),
('c2685e25-d885-4a23-9c00-3d7b4ac5dcfd', 'INF-2026-A0672334', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 6', '', '2026-09-25T18:51:19.513Z'),
('cdbca359-6265-4881-94da-d3561fa43f36', 'INF-2026-384DEFA9', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 1', '', '2026-09-25T18:38:45.413Z'),
('cefc84e4-8adf-4495-a830-ef91a8db6390', 'INF-2026-A0672334', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 2', '', '2026-09-25T18:18:05.658Z'),
('d0e58eb6-039a-4f60-8a02-97f1f14f117e', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 1', '', '2026-09-25T11:47:42.452Z'),
('e41041a0-89f2-4979-88e3-18015a31d10f', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Draf diperbarui', '', '2026-09-25T12:41:55.731Z'),
('fc467d76-be9a-4a01-9958-00df177d79d1', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Tahap dilanjutkan ke 3', '', '2026-09-25T12:29:19.777Z'),
('ff107e8f-21a7-4724-8b91-0e550c620804', 'INF-2026-384DEFA9', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Informasi diterima', 'Kasus baru dicatat untuk verifikasi.', '2026-09-25T18:35:50.636Z');

-- --------------------------------------------------------

--
-- Table structure for table `evidence_photos`
--

CREATE TABLE `evidence_photos` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `object_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` int NOT NULL,
  `uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `evidence_photos`
--

INSERT INTO `evidence_photos` (`id`, `incident_id`, `object_key`, `filename`, `content_type`, `size_bytes`, `uploaded_by`, `created_at`) VALUES
('0dd4bc27-13c2-45a5-b137-a6f15a313cf5', 'INF-2026-67E9B4E6', 'evidence/INF-2026-67E9B4E6/0dd4bc27-13c2-45a5-b137-a6f15a313cf5', 'Screenshot From 2026-08-01 17-07-55.png', 'image/png', 346469, '147c80a2-5d39-423e-9549-2afa8ff11359', '2026-09-25T17:12:52.839Z'),
('d86d4a74-834f-424d-b37f-bcc779409ac4', 'INF-2026-A0672334', 'evidence/INF-2026-A0672334/d86d4a74-834f-424d-b37f-bcc779409ac4', 'khaled-ghareeb-n84s3jgzhKk-unsplash.jpg', 'image/jpeg', 527165, '147c80a2-5d39-423e-9549-2afa8ff11359', '2026-09-25T18:52:08.712Z');

-- --------------------------------------------------------

--
-- Table structure for table `execution_evidence`
--

CREATE TABLE `execution_evidence` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `object_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` int NOT NULL,
  `uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `execution_evidence`
--

INSERT INTO `execution_evidence` (`id`, `incident_id`, `object_key`, `filename`, `content_type`, `size_bytes`, `uploaded_by`, `created_at`) VALUES
('72c8b8b3-a539-4936-8c23-2e327206c922', 'INF-2026-A0672334', 'execution-evidence/INF-2026-A0672334/72c8b8b3-a539-4936-8c23-2e327206c922', 'logo_lampung.png', 'image/png', 416033, 'ba2b64af-6d4c-4efe-9ade-8e012d92a57b', '2026-09-25T18:50:01.890Z'),
('d431846d-4f2e-40be-8507-11f6c1ab5fc5', 'INF-2026-67E9B4E6', 'execution-evidence/INF-2026-67E9B4E6/d431846d-4f2e-40be-8507-11f6c1ab5fc5', 'WhatsApp Image 2026-09-14 at 7.19.02 AM.jpeg', 'image/jpeg', 142813, 'ba2b64af-6d4c-4efe-9ade-8e012d92a57b', '2026-09-25T14:15:28.080Z'),
('d75abb7c-a5af-4937-9b7d-d9c11b73b537', 'INF-2026-67E9B4E6', 'execution-evidence/INF-2026-67E9B4E6/d75abb7c-a5af-4937-9b7d-d9c11b73b537', 'Screenshot From 2026-06-03 01-43-53.png', 'image/png', 556043, 'ba2b64af-6d4c-4efe-9ade-8e012d92a57b', '2026-09-25T14:17:47.702Z');

-- --------------------------------------------------------

--
-- Table structure for table `historical_incidents`
--

CREATE TABLE `historical_incidents` (
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_recorded_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_stage` int NOT NULL,
  `reporter` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(4000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(250) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `case_status` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `verification_status` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `source` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SIRATSI',
  `incident_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `historical_incidents`
--

INSERT INTO `historical_incidents` (`incident_id`, `first_recorded_at`, `updated_at`, `current_stage`, `reporter`, `contact`, `description`, `location`, `category`, `priority`, `case_status`, `verification_status`, `source`, `incident_data`) VALUES
('INF-2026-384DEFA9', '2026-09-25T18:35:50.626Z', '2026-09-25T18:38:45.411Z', 1, 'rizki', '09', 'adanya bajak laut', 'perairan kalianda', 'Gangguan keamanan', 'Sedang', 'Aktif', 'Valid', 'SIRATSI', '{\"verifiedReporterName\":\"rizki\",\"verifiedReporterContact\":\"09\",\"occurrenceLocation\":\"perairan kalianda\",\"verifiedBy\":\"lisa — Ditpolairud Polda Lampung\",\"reportSource\":\"Masyarakat\",\"occurrenceTime\":\"2026-09-26T01:00\",\"incidentCharacteristics\":\"kapal merah\",\"supportingEvidence\":\"dsad\",\"verificationMethod\":\"Hubungi pelapor\",\"verificationResult\":\"Valid / dapat ditindaklanjuti\",\"confirmationNotes\":\"dipastikan ada perompakan\",\"verificationStatus\":\"Valid\",\"caseStatus\":\"Aktif\"}'),
('INF-2026-67E9B4E6', '2026-09-25T11:33:48.838Z', '2026-09-25T17:17:58.770Z', 7, 'irawan', '081991193432', 'kapal nelaayn terbalik', 'perairan bakauheni', 'Kecelakaan laut', 'Tinggi', 'Selesai', 'Valid', 'SIRATSI', '{\"verifiedReporterName\":\"irawan\",\"verifiedReporterContact\":\"081991193432\",\"occurrenceLocation\":\"perairan bakauheni\",\"verifiedBy\":\"lisa — Ditpolairud Polda Lampung\",\"reportSource\":\"Masyarakat\",\"occurrenceTime\":\"2026-09-24T20:00\",\"incidentCharacteristics\":\"kapal kecil nelayan\",\"supportingEvidence\":\"kapal terbalik di perairan bakaheni dekat area rute kapal besar\",\"verificationMethod\":\"Hubungi pelapor\",\"verificationResult\":\"Valid / dapat ditindaklanjuti\",\"confirmationNotes\":\"irawan\",\"verificationStatus\":\"Valid\",\"caseStatus\":\"Selesai\",\"coordinates\":\"-5.889325, 105.774651\",\"priorityArea\":\"Ketapang, Bakauheni\",\"riskLevel\":\"Tinggi\",\"priorityReason\":\"keselamatan nelayan \",\"stakeholderRoles\":\"[{\\\"name\\\":\\\"Sat Polairud Polres Jajaran\\\",\\\"kind\\\":\\\"internal\\\",\\\"role\\\":\\\"Pelaksana\\\",\\\"task\\\":\\\"melakaukan evakuasi terhadap nelayan \\\",\\\"pic\\\":\\\"gilang\\\",\\\"due\\\":\\\"2026-09-24T20:23\\\"},{\\\"name\\\":\\\"Wadir Polairud\\\",\\\"kind\\\":\\\"internal\\\",\\\"role\\\":\\\"Koordinator\\\",\\\"task\\\":\\\"koodinasi pelaporan \\\",\\\"pic\\\":\\\"bambang\\\",\\\"due\\\":\\\"2026-09-25T19:29\\\"}]\",\"leaderNotes\":\"evakuasi nelayan penting\",\"leadUnit\":\"Wadir Polairud\",\"externalStakeholders\":\"\",\"roleDivision\":\"Sat Polairud Polres Jajaran: Pelaksana - melakaukan evakuasi terhadap nelayan \\nWadir Polairud: Koordinator - koodinasi pelaporan \",\"responseType\":\"Bantuan SAR\",\"urgency\":\"Sangat Mendesak\",\"responseGoal\":\"Menemukan dan mengevakuasi korban, memastikan kondisi awak kapal, serta mengamankan lokasi kejadian.\",\"responsePlan\":\"Operasi pencarian dan pertolongan kapal nelayan yang terbalik.\",\"targetDate\":\"2026-09-25T20:00\",\"durationHours\":\"2\",\"resources\":\"kapal, sumber daya manusia\",\"approverId\":\"bb64de1b-d80c-4f28-bcd3-b63e4779a16a\",\"approver\":\"erwin\",\"approvalStatus\":\"Disetujui\",\"executionTeam\":\"Sat Polairud Polres Jajaran\",\"executionDate\":\"2026-09-24\",\"executionNotes\":\"nelayan sudh dievakuasi\",\"evidenceReference\":\"terlampir\",\"followUpOwner\":\"bambang\",\"progress\":\"Selesai\",\"followUpDue\":\"2026-09-26\",\"escalation\":\"Eskalasi ke pimpinan\",\"followUpNotes\":\"melakukan patroli di sekitar  area secara berkala\",\"escalationRaisedFor\":\"Eskalasi ke pimpinan:2026-09-26:melakukan patroli di sekitar  area secara berkala\",\"lossAmount\":\"1000000\",\"evaluation\":\"lokasi agak sulit di temukan \",\"lossBasis\":\"uu 1945\",\"mapAction\":\"Tandai lokasi untuk pemantauan\",\"mapUpdateDetails\":\"lokasi rawan\",\"sopAction\":\"Tidak ada pembaruan SOP\",\"completedAt\":\"2026-09-25T17:17:58.770Z\"}'),
('INF-2026-A0672334', '2026-09-25T11:29:43.325Z', '2026-09-25T18:52:23.808Z', 7, 'wawan', '082280783843', 'penangkapan ikan dengan pukat harimau', 'Perairan Kuala Teladas', 'Illegal fishing', 'Tinggi', 'Selesai', 'Valid', 'SIRATSI', '{\"verifiedReporterName\":\"wawan\",\"verifiedReporterContact\":\"082280783843\",\"occurrenceLocation\":\"Perairan Kuala Teladas\",\"verifiedBy\":\"lisa — Ditpolairud Polda Lampung\",\"reportSource\":\"Mitra Bahari\",\"occurrenceTime\":\"2026-09-26T01:00\",\"incidentCharacteristics\":\"kapal warna biru\",\"verificationMethod\":\"Hubungi pelapor\",\"confirmationNotes\":\"aidil\",\"verificationResult\":\"Valid / dapat ditindaklanjuti\",\"verificationStatus\":\"Valid\",\"caseStatus\":\"Selesai\",\"priorityArea\":\"Kuala Teladas\",\"coordinates\":\"-4.691661, 105.907516\",\"riskLevel\":\"Tinggi\",\"priorityReason\":\"jaring dapat merusak karang\",\"stakeholderRoles\":\"[{\\\"name\\\":\\\"Direktur Polairud\\\",\\\"kind\\\":\\\"internal\\\",\\\"role\\\":\\\"Koordinator\\\",\\\"task\\\":\\\"koordinasikan satuan\\\",\\\"pic\\\":\\\"wawan\\\",\\\"due\\\":\\\"2026-09-27T01:19\\\"},{\\\"name\\\":\\\"Sat Polairud Polres Jajaran\\\",\\\"kind\\\":\\\"internal\\\",\\\"role\\\":\\\"Pelaksana\\\",\\\"task\\\":\\\"pelaksana dan pemantauan serta tindakan\\\",\\\"pic\\\":\\\"agus\\\",\\\"due\\\":\\\"2026-09-27T01:19\\\"}]\",\"leaderNotes\":\" pemantauan serta tindakan\",\"leadUnit\":\"Direktur Polairud\",\"externalStakeholders\":\"\",\"roleDivision\":\"Direktur Polairud: Koordinator - koordinasikan satuan\\nSat Polairud Polres Jajaran: Pelaksana - pelaksana dan pemantauan serta tindakan\",\"responseType\":\"Patroli / Penindakan\",\"urgency\":\"Sangat Mendesak\",\"responseGoal\":\"menangkap pelaku pemasangan jaring\",\"responsePlan\":\"tindakan penangkapan\",\"targetDate\":\"2026-09-26T01:00\",\"durationHours\":\"23\",\"resources\":\"kapal c1\",\"approverId\":\"bb64de1b-d80c-4f28-bcd3-b63e4779a16a\",\"approver\":\"erwin\",\"approvalStatus\":\"Disetujui\",\"executionDate\":\"2026-09-26\",\"executionNotes\":\"penangkapan pelaku\",\"executionTeam\":\"Sat Polairud Polres Jajaran\",\"followUpOwner\":\"wawan\",\"progress\":\"Selesai\",\"followUpDue\":\"2026-09-26\",\"followUpNotes\":\"patroli rutin\",\"escalation\":\"Tidak diperlukan\",\"evaluation\":\"tidak ada kendala\",\"lossAmount\":\"100000\",\"mapAction\":\"Tidak ada perubahan peta\",\"sopAction\":\"Tidak ada pembaruan SOP\",\"lossBasis\":\"uu 1945\",\"completedAt\":\"2026-09-25T18:52:23.808Z\"}');

-- --------------------------------------------------------

--
-- Table structure for table `incidents`
--

CREATE TABLE `incidents` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stage` int NOT NULL DEFAULT '0',
  `reporter` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(4000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(250) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sedang',
  `data` text COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `incidents`
--

INSERT INTO `incidents` (`id`, `created_at`, `updated_at`, `stage`, `reporter`, `contact`, `description`, `location`, `category`, `priority`, `data`) VALUES
('INF-2026-384DEFA9', '2026-09-25T18:35:50.626Z', '2026-09-25T18:38:45.411Z', 1, 'rizki', '09', 'adanya bajak laut', 'perairan kalianda', 'Gangguan keamanan', 'Sedang', '{\"verifiedReporterName\":\"rizki\",\"verifiedReporterContact\":\"09\",\"occurrenceLocation\":\"perairan kalianda\",\"verifiedBy\":\"lisa — Ditpolairud Polda Lampung\",\"reportSource\":\"Masyarakat\",\"occurrenceTime\":\"2026-09-26T01:00\",\"incidentCharacteristics\":\"kapal merah\",\"supportingEvidence\":\"dsad\",\"verificationMethod\":\"Hubungi pelapor\",\"verificationResult\":\"Valid / dapat ditindaklanjuti\",\"confirmationNotes\":\"dipastikan ada perompakan\",\"verificationStatus\":\"Valid\",\"caseStatus\":\"Aktif\"}'),
('INF-2026-67E9B4E6', '2026-09-25T11:33:48.838Z', '2026-09-25T17:17:58.770Z', 7, 'irawan', '081991193432', 'kapal nelaayn terbalik', 'perairan bakauheni', 'Kecelakaan laut', 'Tinggi', '{\"verifiedReporterName\":\"irawan\",\"verifiedReporterContact\":\"081991193432\",\"occurrenceLocation\":\"perairan bakauheni\",\"verifiedBy\":\"lisa — Ditpolairud Polda Lampung\",\"reportSource\":\"Masyarakat\",\"occurrenceTime\":\"2026-09-24T20:00\",\"incidentCharacteristics\":\"kapal kecil nelayan\",\"supportingEvidence\":\"kapal terbalik di perairan bakaheni dekat area rute kapal besar\",\"verificationMethod\":\"Hubungi pelapor\",\"verificationResult\":\"Valid / dapat ditindaklanjuti\",\"confirmationNotes\":\"irawan\",\"verificationStatus\":\"Valid\",\"caseStatus\":\"Selesai\",\"coordinates\":\"-5.889325, 105.774651\",\"priorityArea\":\"Ketapang, Bakauheni\",\"riskLevel\":\"Tinggi\",\"priorityReason\":\"keselamatan nelayan \",\"stakeholderRoles\":\"[{\\\"name\\\":\\\"Sat Polairud Polres Jajaran\\\",\\\"kind\\\":\\\"internal\\\",\\\"role\\\":\\\"Pelaksana\\\",\\\"task\\\":\\\"melakaukan evakuasi terhadap nelayan \\\",\\\"pic\\\":\\\"gilang\\\",\\\"due\\\":\\\"2026-09-24T20:23\\\"},{\\\"name\\\":\\\"Wadir Polairud\\\",\\\"kind\\\":\\\"internal\\\",\\\"role\\\":\\\"Koordinator\\\",\\\"task\\\":\\\"koodinasi pelaporan \\\",\\\"pic\\\":\\\"bambang\\\",\\\"due\\\":\\\"2026-09-25T19:29\\\"}]\",\"leaderNotes\":\"evakuasi nelayan penting\",\"leadUnit\":\"Wadir Polairud\",\"externalStakeholders\":\"\",\"roleDivision\":\"Sat Polairud Polres Jajaran: Pelaksana - melakaukan evakuasi terhadap nelayan \\nWadir Polairud: Koordinator - koodinasi pelaporan \",\"responseType\":\"Bantuan SAR\",\"urgency\":\"Sangat Mendesak\",\"responseGoal\":\"Menemukan dan mengevakuasi korban, memastikan kondisi awak kapal, serta mengamankan lokasi kejadian.\",\"responsePlan\":\"Operasi pencarian dan pertolongan kapal nelayan yang terbalik.\",\"targetDate\":\"2026-09-25T20:00\",\"durationHours\":\"2\",\"resources\":\"kapal, sumber daya manusia\",\"approverId\":\"bb64de1b-d80c-4f28-bcd3-b63e4779a16a\",\"approver\":\"erwin\",\"approvalStatus\":\"Disetujui\",\"executionTeam\":\"Sat Polairud Polres Jajaran\",\"executionDate\":\"2026-09-24\",\"executionNotes\":\"nelayan sudh dievakuasi\",\"evidenceReference\":\"terlampir\",\"followUpOwner\":\"bambang\",\"progress\":\"Selesai\",\"followUpDue\":\"2026-09-26\",\"escalation\":\"Eskalasi ke pimpinan\",\"followUpNotes\":\"melakukan patroli di sekitar  area secara berkala\",\"escalationRaisedFor\":\"Eskalasi ke pimpinan:2026-09-26:melakukan patroli di sekitar  area secara berkala\",\"lossAmount\":\"1000000\",\"evaluation\":\"lokasi agak sulit di temukan \",\"lossBasis\":\"uu 1945\",\"mapAction\":\"Tandai lokasi untuk pemantauan\",\"mapUpdateDetails\":\"lokasi rawan\",\"sopAction\":\"Tidak ada pembaruan SOP\",\"completedAt\":\"2026-09-25T17:17:58.770Z\"}'),
('INF-2026-A0672334', '2026-09-25T11:29:43.325Z', '2026-09-25T18:52:23.808Z', 7, 'wawan', '082280783843', 'penangkapan ikan dengan pukat harimau', 'Perairan Kuala Teladas', 'Illegal fishing', 'Tinggi', '{\"verifiedReporterName\":\"wawan\",\"verifiedReporterContact\":\"082280783843\",\"occurrenceLocation\":\"Perairan Kuala Teladas\",\"verifiedBy\":\"lisa — Ditpolairud Polda Lampung\",\"reportSource\":\"Mitra Bahari\",\"occurrenceTime\":\"2026-09-26T01:00\",\"incidentCharacteristics\":\"kapal warna biru\",\"verificationMethod\":\"Hubungi pelapor\",\"confirmationNotes\":\"aidil\",\"verificationResult\":\"Valid / dapat ditindaklanjuti\",\"verificationStatus\":\"Valid\",\"caseStatus\":\"Selesai\",\"priorityArea\":\"Kuala Teladas\",\"coordinates\":\"-4.691661, 105.907516\",\"riskLevel\":\"Tinggi\",\"priorityReason\":\"jaring dapat merusak karang\",\"stakeholderRoles\":\"[{\\\"name\\\":\\\"Direktur Polairud\\\",\\\"kind\\\":\\\"internal\\\",\\\"role\\\":\\\"Koordinator\\\",\\\"task\\\":\\\"koordinasikan satuan\\\",\\\"pic\\\":\\\"wawan\\\",\\\"due\\\":\\\"2026-09-27T01:19\\\"},{\\\"name\\\":\\\"Sat Polairud Polres Jajaran\\\",\\\"kind\\\":\\\"internal\\\",\\\"role\\\":\\\"Pelaksana\\\",\\\"task\\\":\\\"pelaksana dan pemantauan serta tindakan\\\",\\\"pic\\\":\\\"agus\\\",\\\"due\\\":\\\"2026-09-27T01:19\\\"}]\",\"leaderNotes\":\" pemantauan serta tindakan\",\"leadUnit\":\"Direktur Polairud\",\"externalStakeholders\":\"\",\"roleDivision\":\"Direktur Polairud: Koordinator - koordinasikan satuan\\nSat Polairud Polres Jajaran: Pelaksana - pelaksana dan pemantauan serta tindakan\",\"responseType\":\"Patroli / Penindakan\",\"urgency\":\"Sangat Mendesak\",\"responseGoal\":\"menangkap pelaku pemasangan jaring\",\"responsePlan\":\"tindakan penangkapan\",\"targetDate\":\"2026-09-26T01:00\",\"durationHours\":\"23\",\"resources\":\"kapal c1\",\"approverId\":\"bb64de1b-d80c-4f28-bcd3-b63e4779a16a\",\"approver\":\"erwin\",\"approvalStatus\":\"Disetujui\",\"executionDate\":\"2026-09-26\",\"executionNotes\":\"penangkapan pelaku\",\"executionTeam\":\"Sat Polairud Polres Jajaran\",\"followUpOwner\":\"wawan\",\"progress\":\"Selesai\",\"followUpDue\":\"2026-09-26\",\"followUpNotes\":\"patroli rutin\",\"escalation\":\"Tidak diperlukan\",\"evaluation\":\"tidak ada kendala\",\"lossAmount\":\"100000\",\"mapAction\":\"Tidak ada perubahan peta\",\"sopAction\":\"Tidak ada pembaruan SOP\",\"lossBasis\":\"uu 1945\",\"completedAt\":\"2026-09-25T18:52:23.808Z\"}');

--
-- Triggers `incidents`
--
DELIMITER $$
CREATE TRIGGER `sync_historical_incidents_insert` AFTER INSERT ON `incidents` FOR EACH ROW INSERT INTO historical_incidents (incident_id,first_recorded_at,updated_at,current_stage,reporter,contact,description,location,category,priority,case_status,verification_status,source,incident_data)
    VALUES (NEW.id,NEW.created_at,NEW.updated_at,NEW.stage,NEW.reporter,NEW.contact,NEW.description,NEW.location,NEW.category,NEW.priority,
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(NEW.data, '$.caseStatus')),''),COALESCE(JSON_UNQUOTE(JSON_EXTRACT(NEW.data, '$.verificationStatus')),''),'SIRATSI',NEW.data)
    ON DUPLICATE KEY UPDATE updated_at=VALUES(updated_at),current_stage=VALUES(current_stage),reporter=VALUES(reporter),contact=VALUES(contact),description=VALUES(description),location=VALUES(location),category=VALUES(category),priority=VALUES(priority),case_status=VALUES(case_status),verification_status=VALUES(verification_status),incident_data=VALUES(incident_data)
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `sync_historical_incidents_update` AFTER UPDATE ON `incidents` FOR EACH ROW INSERT INTO historical_incidents (incident_id,first_recorded_at,updated_at,current_stage,reporter,contact,description,location,category,priority,case_status,verification_status,source,incident_data)
    VALUES (NEW.id,NEW.created_at,NEW.updated_at,NEW.stage,NEW.reporter,NEW.contact,NEW.description,NEW.location,NEW.category,NEW.priority,
      COALESCE(JSON_UNQUOTE(JSON_EXTRACT(NEW.data, '$.caseStatus')),''),COALESCE(JSON_UNQUOTE(JSON_EXTRACT(NEW.data, '$.verificationStatus')),''),'SIRATSI',NEW.data)
    ON DUPLICATE KEY UPDATE updated_at=VALUES(updated_at),current_stage=VALUES(current_stage),reporter=VALUES(reporter),contact=VALUES(contact),description=VALUES(description),location=VALUES(location),category=VALUES(category),priority=VALUES(priority),case_status=VALUES(case_status),verification_status=VALUES(verification_status),incident_data=VALUES(incident_data)
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `incident_approvals`
--

CREATE TABLE `incident_approvals` (
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `approver_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `requested_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `decided_at` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `decision_note` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `incident_approvals`
--

INSERT INTO `incident_approvals` (`incident_id`, `approver_id`, `requested_by`, `status`, `submitted_at`, `decided_at`, `decision_note`) VALUES
('INF-2026-67E9B4E6', 'bb64de1b-d80c-4f28-bcd3-b63e4779a16a', '147c80a2-5d39-423e-9549-2afa8ff11359', 'approved', '2026-09-25T12:41:58.081Z', '2026-09-25T12:43:18.261Z', ''),
('INF-2026-A0672334', 'bb64de1b-d80c-4f28-bcd3-b63e4779a16a', '147c80a2-5d39-423e-9549-2afa8ff11359', 'approved', '2026-09-25T18:42:36.966Z', '2026-09-25T18:44:05.813Z', 'tindak lanjuti laporan');

-- --------------------------------------------------------

--
-- Table structure for table `incident_escalations`
--

CREATE TABLE `incident_escalations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `raised_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resolved_at` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `automatic` int NOT NULL DEFAULT '0',
  `resolved_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolution_note` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `incident_escalations`
--

INSERT INTO `incident_escalations` (`id`, `incident_id`, `raised_by`, `reason`, `status`, `created_at`, `resolved_at`, `automatic`, `resolved_by`, `resolution_note`) VALUES
('1b908b11-a0fc-4d53-9ca6-7bc4ad91a049', 'INF-2026-67E9B4E6', '147c80a2-5d39-423e-9549-2afa8ff11359', 'Eskalasi ke pimpinan: melakukan patroli di sekitar  area secara berkala', 'active', '2026-09-25T17:04:13.380Z', NULL, 0, NULL, '');

-- --------------------------------------------------------

--
-- Table structure for table `incident_escalation_recipients`
--

CREATE TABLE `incident_escalation_recipients` (
  `escalation_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `incident_escalation_recipients`
--

INSERT INTO `incident_escalation_recipients` (`escalation_id`, `user_id`, `read_at`) VALUES
('1b908b11-a0fc-4d53-9ca6-7bc4ad91a049', '076a8c0b-acac-42a8-a4e8-ce73fc9ce50c', NULL),
('1b908b11-a0fc-4d53-9ca6-7bc4ad91a049', 'bb64de1b-d80c-4f28-bcd3-b63e4779a16a', NULL),
('1b908b11-a0fc-4d53-9ca6-7bc4ad91a049', 'c80d7ee4-43a3-4a95-b46f-e03d278fbf9f', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `incident_handoffs`
--

CREATE TABLE `incident_handoffs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_to` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `raised_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resolved_at` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `incident_stakeholders`
--

CREATE TABLE `incident_stakeholders` (
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organization` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_reads`
--

CREATE TABLE `notification_reads` (
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_seen_updated_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification_reads`
--

INSERT INTO `notification_reads` (`user_id`, `incident_id`, `last_seen_updated_at`) VALUES
('147c80a2-5d39-423e-9549-2afa8ff11359', 'INF-2026-384DEFA9', '2026-09-25T18:38:45.411Z'),
('147c80a2-5d39-423e-9549-2afa8ff11359', 'INF-2026-67E9B4E6', '2026-09-25T17:17:58.770Z'),
('147c80a2-5d39-423e-9549-2afa8ff11359', 'INF-2026-A0672334', '2026-09-25T18:50:04.166Z'),
('ba2b64af-6d4c-4efe-9ade-8e012d92a57b', 'INF-2026-67E9B4E6', '2026-09-25T14:17:57.244Z'),
('ba2b64af-6d4c-4efe-9ade-8e012d92a57b', 'INF-2026-A0672334', '2026-09-25T18:44:05.813Z'),
('bb64de1b-d80c-4f28-bcd3-b63e4779a16a', 'INF-2026-67E9B4E6', '2026-09-25T17:17:58.770Z'),
('bb64de1b-d80c-4f28-bcd3-b63e4779a16a', 'INF-2026-A0672334', '2026-09-25T18:42:36.966Z'),
('c80d7ee4-43a3-4a95-b46f-e03d278fbf9f', 'INF-2026-67E9B4E6', '2026-09-25T12:43:18.261Z'),
('c80d7ee4-43a3-4a95-b46f-e03d278fbf9f', 'INF-2026-A0672334', '2026-09-25T11:29:43.325Z');

-- --------------------------------------------------------

--
-- Table structure for table `password_credentials`
--

CREATE TABLE `password_credentials` (
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_attempts` int NOT NULL DEFAULT '0',
  `locked_until` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_credentials`
--

INSERT INTO `password_credentials` (`user_id`, `password_hash`, `failed_attempts`, `locked_until`, `updated_at`) VALUES
('147c80a2-5d39-423e-9549-2afa8ff11359', '323e3b63e8a32348508a57a800414fc8:500ebb26b2c8580d34e813c7d6af700746ef7d44702303a36f17ff17d47d13f6', 0, NULL, '2026-09-25T10:33:09.639Z'),
('ba2b64af-6d4c-4efe-9ade-8e012d92a57b', '78e3fca103d3083ba156a1d2b53a1f4b:b4e28855e71d54182350072934d9c2e98ace60eef08cbe44ab164510cdb44f00', 0, NULL, '2026-09-25T12:53:49.166Z'),
('bb64de1b-d80c-4f28-bcd3-b63e4779a16a', 'e949ad4fd12e8450dd33894f502c0b83:af2a71e31e1a0fcc7f3eba7a6f672b29f14857505f20c071bd8e6041b8101b23', 0, NULL, '2026-09-25T10:33:35.901Z'),
('c80d7ee4-43a3-4a95-b46f-e03d278fbf9f', 'bc875255048cc02e1783462b4dc57893:1b0cf7b81cbba5342792a679bfdef6a7053195cb4bba8145ed611c25c262bfd1', 0, NULL, '2026-09-25T12:49:38.581Z'),
('f515f705-dc96-46d4-acf1-fb3a2d7d24fb', 'a5c09499fac6cb8d24df0af25ffd9a44:394b6f823a035f130b09a93ff18a21d094069310ca8cf29bc863b43713c5e606', 0, NULL, '2026-09-25T10:34:10.210Z');

-- --------------------------------------------------------

--
-- Table structure for table `password_sessions`
--

CREATE TABLE `password_sessions` (
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_sessions`
--

INSERT INTO `password_sessions` (`token_hash`, `user_id`, `expires_at`, `created_at`) VALUES
('3536b6ac897800520f2b1f2c055c819f084add650b5118ca95e8c10695a1eee6', 'bb64de1b-d80c-4f28-bcd3-b63e4779a16a', '2026-10-02T12:43:00.256Z', '2026-09-25T12:43:00.256Z'),
('8587003416f37517f0cd2207b547cfa3345bd1f4567b6d244584e5e82b0f7410', '147c80a2-5d39-423e-9549-2afa8ff11359', '2026-10-02T16:20:39.057Z', '2026-09-25T16:20:39.057Z'),
('91c50d47c37cafccc0107b504199ec2004d3ac742afffebd8839e508c7b3553b', '147c80a2-5d39-423e-9549-2afa8ff11359', '2026-10-02T10:34:45.301Z', '2026-09-25T10:34:45.301Z'),
('a59b6dad53a23fcc12bef16867604891168c9b3abb883f60f416c85ab7c4e30e', '147c80a2-5d39-423e-9549-2afa8ff11359', '2026-10-02T11:22:40.573Z', '2026-09-25T11:22:40.573Z'),
('e6d623e39d1a7315a96f61b6014b33b034a7fbeb019b440621b26e5ba6c82135', 'ba2b64af-6d4c-4efe-9ade-8e012d92a57b', '2026-10-02T18:49:41.568Z', '2026-09-25T18:49:41.568Z');

-- --------------------------------------------------------

--
-- Table structure for table `schema_migrations`
--

CREATE TABLE `schema_migrations` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `schema_migrations`
--

INSERT INTO `schema_migrations` (`id`, `filename`, `applied_at`) VALUES
('001_baseline_schema', '001_baseline_schema.mjs', '2026-09-25T16:04:05.309Z'),
('002_mark_completed_incidents', '002_mark_completed_incidents.mjs', '2026-09-25T17:18:06.240Z'),
('003_user_profiles', '003_user_profiles.mjs', '2026-09-25T18:02:16.427Z');

-- --------------------------------------------------------

--
-- Table structure for table `sop_documents`
--

CREATE TABLE `sop_documents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(250) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_url` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `notes` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stakeholder_directory`
--

CREATE TABLE `stakeholder_directory` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kind` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `active` int NOT NULL DEFAULT '1',
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stakeholder_directory`
--

INSERT INTO `stakeholder_directory` (`id`, `name`, `kind`, `detail`, `active`, `created_at`, `updated_at`) VALUES
('a2e070c1-6523-4dce-8d11-000000000001', 'Direktur Polairud', 'internal', 'Pengarah / pengendali umum', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000002', 'Wadir Polairud', 'internal', 'Koordinator pelaksanaan', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000003', 'Subbagrenmin', 'internal', 'Administrasi dan logistik', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000004', 'Kabagbinops', 'internal', 'Operasional dan pengendalian', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000005', 'Kabagdal', 'internal', 'Pemantauan dan pengawasan', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000006', 'Kabaglog', 'internal', 'Dukungan sarana prasarana', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000007', 'Sat Polairud Polres Jajaran', 'internal', 'Pelaksanaan lapangan', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000008', 'DKP', 'external', 'Data perikanan dan kebijakan', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000009', 'PSDKP', 'external', 'Pengawasan sumber daya kelautan', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000010', 'TNI AL', 'external', 'Dukungan operasi dan keamanan laut', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000011', 'Basarnas', 'external', 'Operasi pencarian dan pertolongan', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000012', 'KSOP', 'external', 'Lalu lintas dan keselamatan kapal', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000013', 'KPLP', 'external', 'Pengawasan pelayaran', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000014', 'Bea Cukai', 'external', 'Pengawasan barang', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21'),
('a2e070c1-6523-4dce-8d11-000000000015', 'Pemerintah Daerah', 'external', 'Koordinasi wilayah', 1, '2026-09-25 12:19:21', '2026-09-25 12:19:21');

-- --------------------------------------------------------

--
-- Table structure for table `stakeholder_documents`
--

CREATE TABLE `stakeholder_documents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `object_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` int NOT NULL,
  `uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stakeholder_documents`
--

INSERT INTO `stakeholder_documents` (`id`, `incident_id`, `object_key`, `filename`, `content_type`, `size_bytes`, `uploaded_by`, `created_at`) VALUES
('eed0bba3-3480-4e60-b754-6d0dbed3d5a6', 'INF-2026-A0672334', 'stakeholder-documents/INF-2026-A0672334/eed0bba3-3480-4e60-b754-6d0dbed3d5a6', 'daya_tarik_menara_siger_lampung_9c15900abe.jpg', 'image/jpeg', 108649, '147c80a2-5d39-423e-9549-2afa8ff11359', '2026-09-25T18:20:38.884Z');

-- --------------------------------------------------------

--
-- Table structure for table `stakeholder_updates`
--

CREATE TABLE `stakeholder_updates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organization` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(4000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organization` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `job_title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `profile_photo_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auth_user_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` int NOT NULL DEFAULT '1',
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `role`, `organization`, `job_title`, `profile_photo_key`, `auth_user_id`, `active`, `created_at`, `updated_at`) VALUES
('076a8c0b-acac-42a8-a4e8-ce73fc9ce50c', 'hendrawansyah8114@gmail.com', 'hendra wansyah', 'super_admin', 'Ditpolairud Polda Lampung', '', NULL, NULL, 1, '2026-09-24T04:27:58.324Z', '2026-09-24T04:27:58.324Z'),
('147c80a2-5d39-423e-9549-2afa8ff11359', 'lisa@gmail.com', 'lisa', 'internal_receiver', 'Ditpolairud Polda Lampung', '', 'profile-photos/147c80a2-5d39-423e-9549-2afa8ff11359.png', NULL, 1, '2026-09-25T10:33:09.639Z', '2026-09-25T18:03:28.823Z'),
('ba2b64af-6d4c-4efe-9ade-8e012d92a57b', 'sena@gmail.com', 'sena', 'response_executor', 'Ditpolairud Polda Lampung', '', NULL, NULL, 1, '2026-09-25T12:53:49.166Z', '2026-09-25T12:53:49.166Z'),
('bb64de1b-d80c-4f28-bcd3-b63e4779a16a', 'erwin@gmail.com', 'erwin', 'leader_approver', 'Ditpolairud Polda Lampung', '', NULL, NULL, 1, '2026-09-25T10:33:35.901Z', '2026-09-25T10:33:35.901Z'),
('c80d7ee4-43a3-4a95-b46f-e03d278fbf9f', 'superadmin@siratsi.test', 'Super Admin Dev', 'super_admin', 'Ditpolairud Polda Lampung', '', NULL, NULL, 1, '2026-09-25T05:45:15.872Z', '2026-09-25T05:45:15.872Z'),
('f515f705-dc96-46d4-acf1-fb3a2d7d24fb', 'ajis@gmail.com', 'ajis', 'external_stakeholder', 'DKP', '', NULL, NULL, 1, '2026-09-25T10:34:10.210Z', '2026-09-25T10:34:10.210Z');

-- --------------------------------------------------------

--
-- Table structure for table `user_stakeholders`
--

CREATE TABLE `user_stakeholders` (
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stakeholder_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_stakeholders`
--

INSERT INTO `user_stakeholders` (`user_id`, `stakeholder_id`) VALUES
('ba2b64af-6d4c-4efe-9ade-8e012d92a57b', 'a2e070c1-6523-4dce-8d11-000000000007');

-- --------------------------------------------------------

--
-- Table structure for table `verification_evidence`
--

CREATE TABLE `verification_evidence` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `incident_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `object_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size_bytes` int NOT NULL,
  `uploaded_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `verification_evidence`
--

INSERT INTO `verification_evidence` (`id`, `incident_id`, `object_key`, `filename`, `content_type`, `size_bytes`, `uploaded_by`, `created_at`) VALUES
('343922b1-59a6-44d5-8e93-5434843c387e', 'INF-2026-384DEFA9', 'verification-evidence/INF-2026-384DEFA9/343922b1-59a6-44d5-8e93-5434843c387e', 'Lambang Tubaba Fix 1.png', 'image/png', 21991, '147c80a2-5d39-423e-9549-2afa8ff11359', '2026-09-25T18:38:25.636Z'),
('37638d4d-2932-440d-bef6-eefa3ff7505b', 'INF-2026-A0672334', 'verification-evidence/INF-2026-A0672334/37638d4d-2932-440d-bef6-eefa3ff7505b', 'Pengajuan Uang  Muka SID.pdf', 'application/pdf', 139628, '147c80a2-5d39-423e-9549-2afa8ff11359', '2026-09-25T18:16:22.699Z'),
('c7082d7e-785a-4a62-979f-ab427767627c', 'INF-2026-67E9B4E6', 'verification-evidence/INF-2026-67E9B4E6/c7082d7e-785a-4a62-979f-ab427767627c', 'WhatsApp Image 2026-09-14 at 7.19.02 AM.jpeg', 'image/jpeg', 142813, '147c80a2-5d39-423e-9549-2afa8ff11359', '2026-09-25T11:46:19.656Z');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `approval_documents`
--
ALTER TABLE `approval_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `object_key` (`object_key`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_approval_documents_incident` (`incident_id`,`created_at`);

--
-- Indexes for table `approval_history`
--
ALTER TABLE `approval_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `actor_id` (`actor_id`),
  ADD KEY `idx_approval_history_incident` (`incident_id`,`created_at`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `actor_id` (`actor_id`),
  ADD KEY `idx_audit_logs_incident` (`incident_id`,`created_at`);

--
-- Indexes for table `evidence_photos`
--
ALTER TABLE `evidence_photos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `object_key` (`object_key`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_evidence_incident` (`incident_id`,`created_at`);

--
-- Indexes for table `execution_evidence`
--
ALTER TABLE `execution_evidence`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `object_key` (`object_key`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_execution_evidence_incident` (`incident_id`,`created_at`);

--
-- Indexes for table `historical_incidents`
--
ALTER TABLE `historical_incidents`
  ADD PRIMARY KEY (`incident_id`),
  ADD KEY `idx_historical_incidents_updated` (`updated_at`),
  ADD KEY `idx_historical_incidents_category` (`category`);

--
-- Indexes for table `incidents`
--
ALTER TABLE `incidents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_incidents_updated_at` (`updated_at`);

--
-- Indexes for table `incident_approvals`
--
ALTER TABLE `incident_approvals`
  ADD PRIMARY KEY (`incident_id`),
  ADD KEY `approver_id` (`approver_id`),
  ADD KEY `requested_by` (`requested_by`);

--
-- Indexes for table `incident_escalations`
--
ALTER TABLE `incident_escalations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `raised_by` (`raised_by`),
  ADD KEY `idx_incident_escalations_active` (`status`,`created_at`),
  ADD KEY `idx_incident_escalations_incident` (`incident_id`,`created_at`);

--
-- Indexes for table `incident_escalation_recipients`
--
ALTER TABLE `incident_escalation_recipients`
  ADD PRIMARY KEY (`escalation_id`,`user_id`),
  ADD KEY `idx_escalation_recipients_user` (`user_id`,`read_at`);

--
-- Indexes for table `incident_handoffs`
--
ALTER TABLE `incident_handoffs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `raised_by` (`raised_by`),
  ADD KEY `idx_incident_handoffs_active` (`status`,`created_at`),
  ADD KEY `idx_incident_handoffs_incident` (`incident_id`,`created_at`);

--
-- Indexes for table `incident_stakeholders`
--
ALTER TABLE `incident_stakeholders`
  ADD KEY `incident_id` (`incident_id`),
  ADD KEY `idx_incident_stakeholders_org` (`organization`,`incident_id`);

--
-- Indexes for table `notification_reads`
--
ALTER TABLE `notification_reads`
  ADD PRIMARY KEY (`user_id`,`incident_id`),
  ADD KEY `idx_notification_reads_incident` (`incident_id`);

--
-- Indexes for table `password_credentials`
--
ALTER TABLE `password_credentials`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `password_sessions`
--
ALTER TABLE `password_sessions`
  ADD PRIMARY KEY (`token_hash`),
  ADD KEY `idx_password_sessions_user` (`user_id`),
  ADD KEY `idx_password_sessions_expires` (`expires_at`);

--
-- Indexes for table `schema_migrations`
--
ALTER TABLE `schema_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sop_documents`
--
ALTER TABLE `sop_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_sop_documents_status` (`status`,`category`);

--
-- Indexes for table `stakeholder_directory`
--
ALTER TABLE `stakeholder_directory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_stakeholder_directory_name_kind` (`name`,`kind`),
  ADD KEY `idx_stakeholder_directory_active` (`active`,`kind`,`name`);

--
-- Indexes for table `stakeholder_documents`
--
ALTER TABLE `stakeholder_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `object_key` (`object_key`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_stakeholder_documents_incident` (`incident_id`,`created_at`);

--
-- Indexes for table `stakeholder_updates`
--
ALTER TABLE `stakeholder_updates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_stakeholder_updates_incident` (`incident_id`,`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `auth_user_id` (`auth_user_id`);

--
-- Indexes for table `user_stakeholders`
--
ALTER TABLE `user_stakeholders`
  ADD PRIMARY KEY (`user_id`,`stakeholder_id`),
  ADD KEY `idx_user_stakeholders_stakeholder` (`stakeholder_id`,`user_id`);

--
-- Indexes for table `verification_evidence`
--
ALTER TABLE `verification_evidence`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `object_key` (`object_key`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_verification_evidence_incident` (`incident_id`,`created_at`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `approval_documents`
--
ALTER TABLE `approval_documents`
  ADD CONSTRAINT `approval_documents_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `approval_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `approval_history`
--
ALTER TABLE `approval_history`
  ADD CONSTRAINT `approval_history_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `approval_history_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `evidence_photos`
--
ALTER TABLE `evidence_photos`
  ADD CONSTRAINT `evidence_photos_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `evidence_photos_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `execution_evidence`
--
ALTER TABLE `execution_evidence`
  ADD CONSTRAINT `execution_evidence_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `execution_evidence_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `incident_approvals`
--
ALTER TABLE `incident_approvals`
  ADD CONSTRAINT `incident_approvals_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `incident_approvals_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `incident_approvals_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `incident_escalations`
--
ALTER TABLE `incident_escalations`
  ADD CONSTRAINT `incident_escalations_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `incident_escalations_ibfk_2` FOREIGN KEY (`raised_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `incident_escalation_recipients`
--
ALTER TABLE `incident_escalation_recipients`
  ADD CONSTRAINT `incident_escalation_recipients_ibfk_1` FOREIGN KEY (`escalation_id`) REFERENCES `incident_escalations` (`id`),
  ADD CONSTRAINT `incident_escalation_recipients_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `incident_handoffs`
--
ALTER TABLE `incident_handoffs`
  ADD CONSTRAINT `incident_handoffs_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `incident_handoffs_ibfk_2` FOREIGN KEY (`raised_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `incident_stakeholders`
--
ALTER TABLE `incident_stakeholders`
  ADD CONSTRAINT `incident_stakeholders_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`);

--
-- Constraints for table `notification_reads`
--
ALTER TABLE `notification_reads`
  ADD CONSTRAINT `notification_reads_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `notification_reads_ibfk_2` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`);

--
-- Constraints for table `password_credentials`
--
ALTER TABLE `password_credentials`
  ADD CONSTRAINT `password_credentials_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `password_sessions`
--
ALTER TABLE `password_sessions`
  ADD CONSTRAINT `password_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `sop_documents`
--
ALTER TABLE `sop_documents`
  ADD CONSTRAINT `sop_documents_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `stakeholder_documents`
--
ALTER TABLE `stakeholder_documents`
  ADD CONSTRAINT `stakeholder_documents_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `stakeholder_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `stakeholder_updates`
--
ALTER TABLE `stakeholder_updates`
  ADD CONSTRAINT `stakeholder_updates_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `stakeholder_updates_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_stakeholders`
--
ALTER TABLE `user_stakeholders`
  ADD CONSTRAINT `user_stakeholders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_stakeholders_ibfk_2` FOREIGN KEY (`stakeholder_id`) REFERENCES `stakeholder_directory` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `verification_evidence`
--
ALTER TABLE `verification_evidence`
  ADD CONSTRAINT `verification_evidence_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `verification_evidence_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
