/** Menyamakan status kasus lama yang sudah berada pada tahap Selesai. */
export async function up(connection) {
  await connection.query(`UPDATE incidents
    SET data = JSON_SET(COALESCE(data, JSON_OBJECT()), '$.caseStatus', 'Selesai')
    WHERE stage = 7
      AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '$.caseStatus')), '') <> 'Selesai'`);
}
