# Production Runbook

Dokumen ini menjadi checklist operasional untuk deployment Nuxt/Nitro ke Vercel.

## 1. Sebelum deploy

CI wajib lulus pada branch/PR sebelum staged rollout. Workflow CI menjalankan install lockfile, Prisma validation, security tests, dan typecheck tanpa mengakses database production.

1. Pastikan branch yang akan dideploy sudah melalui review.
2. Jalankan validasi lokal:

   ```bash
   pnpm prisma validate
   pnpm exec nuxt prepare
   pnpm test:security
   ```

3. Jalankan deployment gate sebelum membuat deployment:

   ```bash
   pnpm predeploy:verify
   ```

   Command ini menjalankan schema validation, security tests, dan typecheck.
4. Pastikan migration Prisma sudah direview. Periksa status migration:

   ```bash
   pnpm db:migrate:status
   ```

   Terapkan migration production hanya melalui pipeline terkontrol:

   ```bash
   pnpm db:migrate:deploy
   ```

   Gunakan `migrate deploy`, bukan `db push`, pada database production. Jangan menjalankan `migrate reset` di production.
5. Pastikan environment wajib tersedia di Vercel:

   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
   - `NUXT_SESSION_PASSWORD`
   - `PUBLIC_SITE_URL`
   - `TRACKING_SECRET`
   - `INTERNAL_HEALTH_TOKEN`

5. Pastikan `PUBLIC_SITE_URL` menggunakan HTTPS dan short-link domain milik sendiri.
6. Jangan menaruh provider secret di `runtimeConfig.public`, query string, atau client bundle.

## 2. Smoke test dan health check

Set URL Preview/Staging tanpa menyimpan secret ke repository, lalu jalankan:

```bash
SMOKE_BASE_URL=https://preview.example.com pnpm smoke:staging
```

Untuk memeriksa infrastructure health dengan token melalui header:

```bash
SMOKE_BASE_URL=https://preview.example.com SMOKE_HEALTH_TOKEN=<secret> pnpm smoke:staging
```

Smoke test memeriksa `/robots.txt`, `/signin`, short code yang tidak ditemukan, dan authorization health endpoint. Jangan menaruh token pada URL atau commit file environment.

Endpoint internal:

```text
GET /api/internal/health
x-internal-health-token: <INTERNAL_HEALTH_TOKEN>
```

Expected response:

```json
{ "ok": true, "services": { "redis": {}, "rabbitmq": {} } }
```

Endpoint ini fail-closed jika token tidak dikonfigurasi. Redis dan RabbitMQ berstatus optional; service yang tidak dikonfigurasi tidak dianggap gagal.

Untuk monitoring eksternal, gunakan Vercel Observability atau monitor privat yang dapat mengirim header rahasia. Jangan expose token di URL.

## 3. Alert minimum

Buat alert untuk:

- HTTP 5xx meningkat pada `/r/*` atau `/api/*`.
- Redirect latency p95/p99 meningkat.
- Database connection error atau migration gagal.
- Rate-limit fallback Redis terlalu sering.
- Tracking provider failure meningkat.
- Login failure atau invitation abuse meningkat.
- Campaign blocked/bot outcome melonjak tidak normal.

Redirect tetap harus berjalan jika analytics provider atau Redis gagal; kegagalan tersebut dicatat di log dan tidak boleh membocorkan secret atau raw IP.

## 4. Incident response

### Redirect salah atau open redirect

1. Pause/archive campaign bermasalah dari dashboard admin.
2. Jika dashboard tidak tersedia, nonaktifkan campaign langsung pada database dengan prosedur terotorisasi.
3. Simpan request ID, short code, waktu kejadian, dan outcome.
4. Jangan menghapus audit log.
5. Validasi target dan blocked URL sebelum mengaktifkan kembali.

### Dugaan account takeover

1. Suspend user dari Admin > Users.
2. Revoke session/cookie melalui mekanisme session yang tersedia.
3. Audit campaign, invitation, dan audit-log terbaru.
4. Rotate secret yang terdampak setelah bukti dikumpulkan.

### Database atau migration bermasalah

1. Hentikan migration lanjutan.
2. Simpan log deployment dan error database.
3. Roll back application ke deployment Vercel terakhir yang sehat jika schema kompatibel.
4. Restore database hanya berdasarkan backup yang diverifikasi.
5. Catat hasil restore drill dan tindakan koreksi.

## 5. Rollback deployment

1. Buka deployment terakhir yang sehat di Vercel.
2. Promote deployment tersebut ke production.
3. Jalankan smoke test login, campaign list, create/preview, dan `/r/:shortCode`.
4. Periksa `/api/internal/health` dari monitor privat.
5. Jangan melakukan rollback schema secara manual tanpa backup dan rencana data migration.

## 6. Rotasi secret

Secret yang perlu memiliki prosedur rotasi:

- `NUXT_SESSION_PASSWORD`
- `INTERNAL_HEALTH_TOKEN`
- `TRACKING_SECRET`
- Provider tracking tokens
- Redis token
- CloudAMQP credentials
- Database credentials

Setelah rotasi, lakukan redeploy dan smoke test. Catat waktu rotasi tanpa mencatat nilai secret.

## 7. Dependency maintenance

Dependabot membuat pull request mingguan untuk dependency npm dan mengelompokkan update Nuxt, Prisma, dan frontend. Setiap update harus melewati:

```bash
pnpm install --frozen-lockfile
pnpm predeploy:verify
pnpm build
```

Jangan menjalankan upgrade massal atau `pnpm audit --fix` langsung pada branch production. Review changelog, lockfile, peer dependency, dan hasil build terlebih dahulu. Advisory transitive yang belum memiliki update upstream dicatat sebagai risiko dan dimonitor sampai patch tersedia.

## 8. Backup dan restore

Ikuti prosedur drill lengkap pada `docs/BACKUP_RESTORE_DRILL.md`. Restore harus dilakukan ke database staging yang berbeda dari production dan tidak boleh menggunakan `migrate reset` pada production.

## 9. Data privacy

- Jangan log raw IP, raw `fbclid`, access token, atau password.
- Pertahankan HMAC/hash analytics sesuai retention policy.
- Review audit log dan analytics retention secara berkala.
- Sediakan proses penghapusan data jika diwajibkan kebijakan privasi atau hukum yang berlaku.
