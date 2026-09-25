/**
 * Baseline untuk instalasi baru. Isi skema lengkap tetap berada di
 * database/mysql-schema.sql agar mudah ditinjau sebagai satu snapshot.
 */
export async function up(connection, context) {
  await connection.query(context.schema);
}
