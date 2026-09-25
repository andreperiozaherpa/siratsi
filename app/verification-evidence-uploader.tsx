'use client';

import { useEffect, useState } from 'react';
import { FileText, ImagePlus } from 'lucide-react';

type Evidence = { id: string; filename: string; contentType: string; sizeBytes: number; createdAt: string };
const accepted = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg', 'audio/wav'];

export function VerificationEvidenceUploader({ incidentId }: { incidentId: string }) {
  const [files, setFiles] = useState<Evidence[]>([]); const [uploading, setUploading] = useState(false); const [error, setError] = useState('');
  const load = async () => { const response = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}/verification-evidence`, { cache: 'no-store' }); if (!response.ok) throw new Error('Bukti pendukung belum dapat dimuat.'); setFiles(await response.json() as Evidence[]); };
  useEffect(() => { void load().catch((reason) => setError(reason instanceof Error ? reason.message : 'Bukti pendukung belum dapat dimuat.')); }, [incidentId]);
  const upload = async (selected: File[]) => {
    if (!selected.length) return; if (selected.length + files.length > 8) { setError('Maksimal 8 bukti pendukung.'); return; }
    setUploading(true); setError('');
    try { for (const file of selected) { if (!accepted.includes(file.type) || file.size > 15 * 1024 * 1024) throw new Error('Pilih PDF, foto, video MP4, atau audio maksimal 15 MB.'); const body = new FormData(); body.append('evidence', file); const response = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}/verification-evidence`, { method: 'POST', body }); if (!response.ok) throw new Error(response.status === 413 ? 'Ukuran berkas melebihi batas server. Pilih berkas maksimal 15 MB.' : 'Bukti pendukung gagal diunggah.'); } await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Bukti pendukung gagal diunggah.'); } finally { setUploading(false); }
  };
  return <div><div className="verification-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(Array.from(event.dataTransfer.files)); }}><label className="upload-control" htmlFor="verification-evidence-upload"><ImagePlus size={21} /><span>{uploading ? 'Mengunggah bukti...' : 'Pilih berkas atau seret ke sini'}</span></label><input className="visually-hidden" id="verification-evidence-upload" type="file" accept={accepted.join(',')} multiple disabled={uploading || files.length >= 8} onChange={(event) => { const selected = Array.from(event.target.files || []); event.target.value = ''; void upload(selected); }} /><small>PDF, foto, video MP4, atau audio · maksimal 15 MB per berkas.</small></div>{error && <p className="stake-directory-error">{error}</p>}{files.length > 0 && <div className="evidence-preview-grid">{files.map((file) => { const url = `/api/incidents/${encodeURIComponent(incidentId)}/verification-evidence/${file.id}`; return <a className="evidence-preview" key={file.id} href={url} target="_blank" rel="noreferrer">{file.contentType.startsWith('image/') ? <img src={url} alt={file.filename} loading="lazy" /> : <span className="pdf-preview"><FileText size={31} />{file.contentType === 'application/pdf' ? 'PDF' : 'Berkas'}</span>}<b>{file.filename}</b><small>{Math.ceil(file.sizeBytes / 1024)} KB</small></a>; })}</div>}</div>;
}
