'use client';

import { useEffect, useState } from 'react';
import { BookOpen, History } from 'lucide-react';

type AuditEvent = { action: string; detail: string; created_at: string; actor: string };
type SopDocument = { id: string; title: string; category: string; version: string; referenceUrl: string };

export function AuditTrail({ incidentId }: { incidentId: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  useEffect(() => { void fetch(`/api/incidents/${encodeURIComponent(incidentId)}/audit`, { cache: 'no-store' }).then(async (response) => response.ok ? setEvents(await response.json() as AuditEvent[]) : undefined).catch(() => undefined); }, [incidentId]);
  return <section className="stake-section"><h4><History size={17} /> Audit trail</h4>{events.length ? <div className="flow">{events.map((event, index) => <div className="flow-item" key={`${event.created_at}-${index}`}><b>{event.action} · {event.actor}</b><small>{new Date(event.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}{event.detail ? ` · ${event.detail}` : ''}</small></div>)}</div> : <p className="stake-hint">Belum ada aktivitas tercatat.</p>}</section>;
}

export function SopReferencePicker({ value, onChange, disabled }: { value: string; onChange: (id: string, title: string) => void; disabled?: boolean }) {
  const [documents, setDocuments] = useState<SopDocument[]>([]);
  useEffect(() => { void fetch('/api/sop', { cache: 'no-store' }).then(async (response) => response.ok ? setDocuments(await response.json() as SopDocument[]) : undefined).catch(() => undefined); }, []);
  const selected = documents.find((document) => document.id === value);
  return <section className="response-section"><h3><BookOpen size={17} /> SOP atau regulasi acuan</h3><label>Pilih dokumen acuan<select disabled={disabled} value={value} onChange={(event) => { const document = documents.find((item) => item.id === event.target.value); onChange(event.target.value, document?.title || ''); }}><option value="">Belum memilih dokumen</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.category} · {document.title} (v{document.version})</option>)}</select></label><a href="/sop">Buka repositori SOP & regulasi</a>{!documents.length && <p className="response-hint">Belum ada dokumen aktif pada repositori SOP dan regulasi.</p>}{selected?.referenceUrl && <a href={selected.referenceUrl} target="_blank" rel="noreferrer">Buka dokumen acuan ↗</a>}</section>;
}
