/** Menyamakan master stakeholder dengan struktur Ditpolairud dan instansi yang digunakan. */
export async function up(connection) {
  const updates = [
    ['Kabagbinopsnal', 'Operasional dan pengendalian', 'a2e070c1-6523-4dce-8d11-000000000003'],
    ['Kasubbagrenmin', 'Administrasi dan logistik', 'a2e070c1-6523-4dce-8d11-000000000004'],
    ['Kasubditgakkum', 'Penegakan hukum perairan', 'a2e070c1-6523-4dce-8d11-000000000005'],
    ['Kasubditpolairud', 'Operasi dan patroli perairan', 'a2e070c1-6523-4dce-8d11-000000000006'],
    ['Kasubditfasharkan', 'Fasilitas pemeliharaan dan perbaikan kapal', 'a2e070c1-6523-4dce-8d11-000000000007'],
  ];
  for (const [name, detail, id] of updates) await connection.query('UPDATE stakeholder_directory SET name=?, detail=?, active=1, updated_at=? WHERE id=?', [name, detail, new Date().toISOString(), id]);
  await connection.query("UPDATE stakeholder_directory SET active=0, updated_at=? WHERE kind='external' AND name IN ('TNI AL','Bea Cukai','Pemerintah Daerah')", [new Date().toISOString()]);
}
