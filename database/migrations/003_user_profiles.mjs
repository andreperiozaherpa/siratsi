/** Menyediakan jabatan dan referensi foto untuk profil pengguna. */
export async function up(connection) {
  await connection.query("ALTER TABLE users ADD COLUMN job_title VARCHAR(150) NOT NULL DEFAULT '' AFTER organization");
  await connection.query("ALTER TABLE users ADD COLUMN profile_photo_key VARCHAR(255) NULL AFTER job_title");
}
