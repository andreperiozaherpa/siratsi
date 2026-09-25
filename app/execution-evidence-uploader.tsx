'use client';

import { useEffect, useState } from 'react';
import { FileText, FileUp, ImagePlus } from 'lucide-react';

type Evidence = { id: string; filename: string; contentType: string; sizeBytes: number; createdAt: string };

async function responseError(response: Response, fallback: string) {
  const text = await response.text();
  try {
    const body = JSON.parse(text) as { error?: string };
    if (body.error) return body.error;
  } catch { /* Some proxies return a plain-text error page. */ }
  if (response.status === 413) return 'Ukuran berkas melebihi batas server. Pilih berkas maksimal 15 MB.';
  return text || fallback;
}

export function ExecutionEvidenceUploader({ incidentId }: { incidentId: string }) {
  const [files, setFiles] = useState<Evidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    const response = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}/execution-evidence`, { cache: 'no-store' });
    if (!response.ok) throw new Error(await responseError(response, 'Bukti pelaksanaan belum dapat dimuat.'));
    setFiles(await response.json() as Evidence[]);
  };
  useEffect(() => { void load().catch((reason) => setError(reason instanceof Error ? reason.message : 'Bukti pelaksanaan belum dapat dimuat.')); }, [incidentId]);
  const upload = async (selected: File[]) => {
    if (!selected.length) return;
    if (selected.length + files.length > 10) { setError('Maksimal 10 berkas bukti pelaksanaan.'); return; }
    setUploading(true); setError('');
    try {
      for (const file of selected) {
        if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) throw new Error('Pilih PDF, JPG, PNG, atau WebP maksimal 15 MB per berkas.');
        const body = new FormData(); body.append('evidence', file);
        const response = await fetch(`/api/incidents/${encodeURIComponent(incidentId)}/execution-evidence`, { method: 'POST', body });
        if (!response.ok) throw new Error(await responseError(response, 'Unggah bukti gagal.'));
      }
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unggah bukti gagal.'); }
    finally { setUploading(false); }
  };
  return <div className="execution-evidence"><div className="verification-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(Array.from(event.dataTransfer.files)); }}><label className="upload-control" htmlFor="execution-evidence-upload"><ImagePlus size={21} /><span>{uploading ? 'Mengunggah bukti...' : 'Pilih berkas atau seret ke sini'}</span></label><input className="visually-hidden" id="execution-evidence-upload" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple disabled={uploading || files.length >= 10} onChange={(event) => { const selected = Array.from(event.target.files || []); event.target.value = ''; void upload(selected); }} /><small>PDF, JPG, PNG, atau WebP · maksimal 15 MB per berkas · maksimal 10 berkas.</small></div>{error && <p className="stake-directory-error">{error}</p>}{files.length > 0 && <div className="evidence-preview-grid">{files.map((file) => { const url = `/api/incidents/${encodeURIComponent(incidentId)}/execution-evidence/${file.id}`; return <a className="evidence-preview" key={file.id} href={url} target="_blank" rel="noreferrer">{file.contentType.startsWith('image/') ? <img src={url} alt={file.filename} loading="lazy" /> : <span className="pdf-preview"><FileText size={31} />PDF</span>}<b>{file.filename}</b><small>{Math.ceil(file.sizeBytes / 1024)} KB</small></a>; })}</div>}</div>;
}
