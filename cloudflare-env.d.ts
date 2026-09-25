declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    SIRATSI_ADMIN_EMAIL?: string;
  }
}
