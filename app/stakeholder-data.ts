export const internalUnits = [
  { name: 'Direktur Polairud', detail: 'Pengarah / pengendali umum' },
  { name: 'Wadir Polairud', detail: 'Koordinator pelaksanaan' },
  { name: 'Kabagbinopsnal', detail: 'Operasional dan pengendalian' },
  { name: 'Kasubbagrenmin', detail: 'Administrasi dan logistik' },
  { name: 'Kasubditgakkum', detail: 'Penegakan hukum perairan' },
  { name: 'Kasubditpolairud', detail: 'Operasi dan patroli perairan' },
  { name: 'Kasubditfasharkan', detail: 'Fasilitas pemeliharaan dan perbaikan kapal' },
] as const;

export const externalDetails: Record<string, string> = {
  DKP: 'Data perikanan dan kebijakan',
  PSDKP: 'Pengawasan sumber daya kelautan',
  Basarnas: 'Operasi pencarian dan pertolongan',
  KSOP: 'Lalu lintas dan keselamatan kapal',
  KPLP: 'Pengawasan pelayaran',
};

export const stakeholderRoles = ['Koordinator', 'Pelaksana', 'Penyedia Data', 'Penindakan', 'Dukungan SAR', 'Pemantauan', 'Logistik', 'Lainnya'] as const;
export type StakeholderRow = { name: string; kind: 'internal' | 'external'; role: string; task: string; pic: string; due: string };
export function readStakeholderRows(raw: unknown): StakeholderRow[] {
  if (typeof raw !== 'string') return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((row): row is StakeholderRow => Boolean(row && typeof row === 'object' && typeof row.name === 'string' && (row.kind === 'internal' || row.kind === 'external') && typeof row.role === 'string' && typeof row.task === 'string' && typeof row.pic === 'string' && typeof row.due === 'string')).slice(0, 20) : [];
  } catch { return []; }
}
