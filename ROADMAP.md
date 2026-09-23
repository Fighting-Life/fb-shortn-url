# Roadmap Facebook Referring, Link Shortener & Analytics

> Dokumen perencanaan untuk aplikasi Nuxt 4 + Nuxt UI + Tailwind CSS + Prisma + Neon PostgreSQL, dengan target deployment Vercel.
>
> **Catatan keamanan dan kepatuhan:** aplikasi ini sebaiknya digunakan sebagai short-link, redirect, attribution, dan analytics service pada domain yang dikendalikan sendiri. Jangan menyamarkan tujuan URL, memalsukan host/platform, melewati sistem keamanan platform, atau melakukan cloaking berdasarkan crawler versus manusia untuk menipu pengguna/platform. Semua redirect harus transparan, tervalidasi, dapat diaudit, dan mematuhi Terms of Service Meta, aturan iklan, hukum privasi, serta kebijakan anti-abuse.

---

## 1. Tujuan Produk

Membangun platform multi-user untuk:

- Membuat dan mengelola campaign short URL.
- Mengarahkan visitor ke `targetUrl` atau `blockedUrl` berdasarkan rule yang jelas.
- Mencatat attribution seperti `fbclid` secara aman dan proporsional.
- Mengumpulkan analytics agregat untuk dashboard.
- Menyediakan role `ADMIN` dan `USER`.
- Menyediakan preview, pause, archive, dan audit trail untuk campaign.
- Menjaga performa redirect tetap cepat pada environment serverless Vercel.

Contoh URL produksi yang direkomendasikan:

```text
https://go.example.com/r/{shortCode}?fbclid={fbclid}
```

Jangan menggunakan host Facebook atau host pihak ketiga yang tidak dikendalikan sendiri sebagai bagian dari URL hasil generate. `shared/utils/facebook_url.ts` saat ini hanya dianggap sebagai prototipe dan perlu direvisi pada fase implementasi redirect.

---

## 2. Kondisi Project Saat Ini

Teknologi yang sudah terlihat di project:

- Nuxt 4
- Nuxt UI 4
- Vue 3
- Tailwind CSS
- Prisma 7
- Neon PostgreSQL
- `@vee-validate/zod` dan Zod
- Nuxt Auth Utils
- Upstash Redis dan CloudAMQP sebagai opsi

File awal yang perlu ditinjau:

- `shared/types/index.d.ts`
- `shared/utils/facebook_url.ts`
- `prisma/schema.prisma`
- `server/`
- `app/pages/`

Catatan awal:

- `DeviceType` dan tipe URL sudah tersedia, tetapi perlu disesuaikan dengan domain short-link milik aplikasi.
- `facebook_url.ts` masih membuat host berbasis `facebook.com`; pola ini tidak boleh digunakan untuk sistem produksi.
- Perlu menambahkan validasi URL, allowlist/denylist domain, SSRF protection, rate limit, audit log, dan model analytics.
- Hindari menyimpan raw IP, `fbclid`, user-agent, atau data fingerprinting tanpa tujuan, retensi, dan dasar pemrosesan yang jelas.

---

## 3. Arsitektur Target

```text
Visitor
  |
  v
Own Short Domain / Vercel Edge
  |
  +--> Validate short code and campaign status
  +--> Apply consent and abuse/rate-limit checks
  +--> Resolve device/country/IP rules
  +--> Emit minimal redirect event
  +--> 302/307 redirect to approved destination
  |
  v
Target URL

Dashboard Nuxt
  |
  +--> Server API
  +--> Prisma ORM
  +--> Neon PostgreSQL
  +--> Redis cache/rate limit (optional)
  +--> Queue/worker (optional, only for async aggregation)
```

### Prinsip desain

1. Redirect path harus ringan dan tidak menunggu proses analytics berat.
2. Analytics detail diproses async jika volume sudah besar.
3. Semua destination URL divalidasi sebelum disimpan.
4. Short code tidak boleh berisi data sensitif.
5. Rule harus fail closed untuk kondisi invalid dan fail safe untuk gangguan analytics.
6. Admin action harus tercatat di audit log.
7. Data analytics dibuat agregat dan memiliki retention policy.

---

## 4. Scope Fitur

### 4.1 Authentication dan Authorization

- Login, logout, session, dan email verification.
- OAuth hanya untuk provider yang benar-benar diperlukan.
- Role:
  - `ADMIN`: user management, global settings, abuse review, audit log.
  - `USER`: campaign milik sendiri, analytics milik sendiri, profile/settings terbatas.
- Server-side authorization pada setiap endpoint; jangan hanya mengandalkan route middleware.
- Proteksi CSRF/session sesuai mekanisme Nuxt Auth Utils.
- MFA untuk admin sebagai fase lanjutan.

### 4.2 Campaign URL Management

CRUD campaign:

- Create campaign.
- Edit campaign.
- Preview campaign.
- Pause/resume campaign.
- Archive campaign.
- Delete soft-delete.
- Regenerate short code secara eksplisit.
- Duplicate campaign.
- Export analytics.

Field utama campaign:

- `name`
- `slug` atau `shortCode`
- `targetUrl`
- `blockedUrl`
- `status`: `DRAFT`, `ACTIVE`, `PAUSED`, `ARCHIVED`, `BLOCKED`
- `ownerId`
- `expiresAt`
- `startAt`
- `defaultDevice`
- `preserveQueryParams`
- `allowedDomains`
- `trackingConfig`
- `ruleConfig`

### 4.3 Redirect dan Attribution

Alur request:

1. Terima `shortCode` dari domain sendiri.
2. Validasi format dan lookup campaign.
3. Periksa status, jadwal aktif, dan expiry.
4. Validasi rule device/country/IP secara terbatas dan legal.
5. Ambil attribution parameter yang diizinkan, contohnya `fbclid`, `utm_source`, `utm_medium`, dan `utm_campaign`.
6. Hasilkan redirect ke URL yang telah disimpan dan divalidasi.
7. Buat event analytics minimal.
8. Redirect dengan status `302` atau `307` sesuai kebutuhan campaign.

Token internal:

- Gunakan `shortCode` acak dengan entropy memadai.
- Gunakan signed token atau HMAC jika membawa state pada URL.
- Jangan menaruh secret, raw IP, atau data user di query string.
- Jika perlu menghubungkan click dengan event, simpan mapping server-side dan gunakan opaque ID.
- Rotasi token tidak boleh dimaksudkan untuk menghindari deteksi, moderasi, atau kebijakan platform.

### 4.4 Rule Device, Country, dan IP

Rule dipisahkan menjadi:

- `allow`: hanya daftar yang diperbolehkan.
- `exclude`: daftar yang diarahkan ke `blockedUrl`.
- `fallback`: tujuan jika data tidak tersedia.

Device:

- `desktop`
- `mobile`
- `tablet`
- `ios`
- `android`
- `unknown`

Country:

- Gunakan kode ISO 3166-1 alpha-2.
- Tentukan provider GeoIP dan fallback ketika lookup gagal.
- Jangan menyimpan lokasi presisi jika tidak diperlukan.

IP:

- Gunakan CIDR parser yang teruji.
- Simpan hash atau prefix IP bila raw IP tidak dibutuhkan.
- Jangan gunakan IP rule untuk diskriminasi ilegal atau fingerprinting berlebihan.
- Sediakan expiry dan alasan setiap rule.

Bot protection:

- Rate limiting.
- Known bot/user-agent handling.
- Challenge hanya bila diperlukan.
- Abuse scoring yang dapat diaudit.
- Jangan membuat konten berbeda untuk crawler dan manusia dengan tujuan menipu indeks atau review platform.

### 4.5 Tracking Integrations

Integrasi harus opt-in per campaign dan configurable:

- Google Analytics 4.
- Meta Pixel/Conversions API sesuai kebijakan dan consent.
- TikTok Pixel.
- Histats atau provider lain.

Konfigurasi:

- Provider.
- Measurement/pixel ID.
- Event mapping.
- Consent requirement.
- Data retention.
- Enable/disable.

Jangan menyimpan access token provider di database plaintext. Gunakan environment secret atau secret manager.

### 4.6 Dashboard Analytics

Home dashboard:

- Total clicks.
- Unique clicks dengan definisi yang jelas.
- Valid clicks.
- Blocked clicks.
- Top campaigns.
- Top referrers.
- Device distribution.
- Country distribution.
- Conversion/event summary jika tersedia.
- Trend harian/mingguan/bulanan.

Campaign analytics:

- Time series clicks.
- Redirect outcome: target vs blocked.
- Device.
- Country agregat.
- Referrer.
- UTM/fbclid attribution yang sudah dipseudonimkan.
- Error rate.
- Export CSV dengan permission check.

Hindari menampilkan atau menyimpan raw `fbclid` lebih lama dari yang diperlukan. Gunakan hash/HMAC ter-salted jika perlu deduplikasi.

### 4.7 User Management untuk Admin

- List/search/filter user.
- Invite user melalui email.
- Edit role/status/profile.
- Suspend/reactivate user.
- Soft-delete user.
- Reset session.
- Lihat campaign milik user.
- Audit setiap perubahan.

### 4.8 Settings Admin

Global settings:

- Default redirect behavior.
- Allowed target schemes: `https` sebagai default.
- Allowed/blocked domains.
- Default retention period.
- Rate-limit policy.
- GeoIP provider.
- Tracking defaults.
- Maintenance mode.
- Abuse contact.
- Privacy policy URL.
- Terms URL.

Settings berisiko tinggi harus memiliki audit trail dan, bila perlu, confirmation step.

---

## 5. Rancangan Data Model Prisma

Model inti yang direkomendasikan:

### Identity

- `User`
- `Session` atau model yang sesuai auth library
- `Invitation`
- `ApiKey` jika API publik diperlukan

### Campaign

- `Campaign`
- `CampaignRule`
- `CampaignTracking`
- `CampaignDomain`
- `RedirectDestination` jika mendukung rotasi destination yang transparan

### Analytics

- `ClickEvent` untuk event minimal/detail ber-retensi pendek
- `DailyCampaignMetric` untuk agregasi jangka panjang
- `ConversionEvent` bila memang digunakan

### Governance

- `AuditLog`
- `AbuseReport`
- `SystemSetting`

Index penting:

- `Campaign.shortCode` unique.
- `Campaign.ownerId, status`.
- `Campaign.createdAt`.
- `ClickEvent.campaignId, occurredAt`.
- `ClickEvent.outcome, occurredAt`.
- `DailyCampaignMetric.campaignId, date` unique.
- `AuditLog.actorId, createdAt`.

Jangan membuat foreign key ke data analytics dengan pola yang menghambat retention dan partitioning. Rancang penghapusan data sejak awal.

---

## 6. API dan Server Route

### Campaign

```text
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/:id
PATCH  /api/campaigns/:id
DELETE /api/campaigns/:id
POST   /api/campaigns/:id/preview
POST   /api/campaigns/:id/pause
POST   /api/campaigns/:id/resume
```

### Redirect

```text
GET /r/:shortCode
```

Karakteristik redirect endpoint:

- Tidak menggunakan data body dari client sebagai destination.
- Tidak mengikuti redirect chain dari target untuk validasi.
- Menggunakan timeout dan validasi URL saat campaign disimpan.
- Tidak membocorkan alasan internal rule kepada visitor.
- Memiliki rate limit dan abuse monitoring.

### Analytics

```text
GET /api/analytics/overview
GET /api/analytics/campaigns/:id
GET /api/analytics/export
```

### Admin

```text
GET    /api/admin/users
POST   /api/admin/invitations
PATCH  /api/admin/users/:id
DELETE /api/admin/users/:id
GET    /api/admin/audit-logs
GET    /api/admin/settings
PATCH  /api/admin/settings
```

Semua endpoint perlu:

- Schema validation.
- Authentication check.
- Authorization/ownership check.
- Pagination.
- Rate limit sesuai risiko.
- Error code konsisten.
- Logging tanpa secret atau data sensitif.

---

## 7. Security Checklist

### URL dan SSRF

- Terima hanya `https://` secara default.
- Tolak `javascript:`, `data:`, `file:`, `blob:`, dan protocol lain.
- Normalisasi URL menggunakan WHATWG `URL`.
- Validasi host dan port.
- Block localhost, private IP range, link-local, metadata endpoint, dan reserved address.
- Pertimbangkan DNS rebinding protection jika melakukan server-side URL fetch.
- Jangan fetch target URL dari server hanya untuk memeriksa status tanpa alasan kuat.

### Authentication

- Secure, HttpOnly, SameSite cookie.
- Session rotation setelah login.
- Password hashing yang aman.
- Email verification.
- Brute-force protection.
- Admin MFA sebagai prioritas lanjutan.

### Abuse prevention

- Rate limit login, invite, campaign create, dan redirect.
- Per-campaign quota.
- Domain reputation/allowlist.
- Abuse report dan suspend flow.
- Audit log immutable secara aplikasi.
- Kill switch untuk campaign atau user.

### Privacy

- Privacy policy dan cookie/consent policy.
- Minimalkan raw IP dan user-agent.
- Retention policy terpisah untuk event detail dan aggregate.
- Hak hapus/export data jika diwajibkan.
- Jangan mengumpulkan fingerprint yang tidak diperlukan.

---

## 8. Redis Upstash dan CloudAMQP

### Redis Upstash — opsional

Gunakan untuk:

- Rate limiting.
- Cache campaign aktif berdasarkan `shortCode`.
- Deduplication window singkat.
- Temporary challenge state.
- Distributed lock ringan.

Jangan gunakan Redis sebagai source of truth untuk campaign atau analytics. Neon/PostgreSQL tetap menjadi sumber utama.

### CloudAMQP — opsional

Tambahkan hanya ketika:

- Volume redirect sudah tinggi.
- Aggregation analytics mengganggu latency redirect.
- Ada worker yang benar-benar membutuhkan retry/dead-letter queue.

Job yang cocok:

- Aggregate click event.
- Cleanup event yang expired.
- Export analytics.
- Email invitation.
- Abuse review notification.

Untuk Vercel serverless, pertimbangkan queue yang mendukung pola serverless dan jangan bergantung pada process worker yang hidup terus-menerus di Vercel Function.

---

## 9. Deployment Vercel

### Komponen

- Nuxt app/server routes pada Vercel Functions/Edge sesuai kebutuhan.
- Neon PostgreSQL dengan pooled connection.
- Custom short domain, misalnya `go.example.com`.
- Upstash Redis bila rate limiting terdistribusi diperlukan.
- Provider email untuk invitation/verification.
- Observability provider atau Vercel Logs.

### Environment variables

```text
DATABASE_URL
DIRECT_DATABASE_URL
NUXT_SESSION_PASSWORD
NUXT_PUBLIC_APP_URL
SHORT_DOMAIN
REDIS_URL
REDIS_TOKEN
EMAIL_PROVIDER_API_KEY
GEOIP_PROVIDER_KEY
TRACKING_SECRET
```

Aturan:

- Jangan commit `.env`.
- Pisahkan Development, Preview, dan Production.
- Rotate secret setelah insiden.
- Jangan expose secret dengan prefix `NUXT_PUBLIC_`.
- Uji migration production dengan prosedur rollback.

### Database deployment

- Gunakan `prisma migrate deploy` pada deployment production.
- Gunakan `prisma generate` pada install/build.
- Pastikan connection pooling Neon sesuai runtime.
- Siapkan backup dan restore drill.

---

## 10. Roadmap Implementasi Bertahap

### Phase 0 — Product, Compliance, dan Baseline

- [ ] Tetapkan use case dan domain milik sendiri.
- [ ] Tetapkan Terms, Privacy Policy, consent, dan abuse process.
- [ ] Definisikan role/permission matrix.
- [ ] Tentukan retention analytics.
- [ ] Audit existing `prisma/schema.prisma` dan server routes.
- [ ] Bersihkan tipe duplikat/inkonsisten di `shared/types/index.d.ts`.
- [ ] Buat test baseline dan error handling standar.

### Phase 1 — Foundation dan Authentication

- [ ] Rapikan auth/session flow.
- [ ] Implementasikan role guard server-side.
- [ ] Buat layout dashboard dan navigation.
- [ ] Buat komponen table, pagination, filter, modal, form, toast.
- [ ] Standarkan `ApiResponse`, error code, dan validation schema.
- [ ] Tambahkan audit log helper.

### Phase 2 — Campaign CRUD

- [ ] Buat model `Campaign` dan migration.
- [ ] Buat short code generator cryptographically secure.
- [ ] Buat form target URL dan blocked URL.
- [ ] Implementasikan URL validation dan domain policy.
- [ ] Implementasikan create/edit/preview/pause/archive/delete.
- [ ] Tambahkan ownership check dan audit event.
- [ ] Revisi `facebook_url.ts` menjadi URL builder untuk domain sendiri.

### Phase 3 — Redirect Engine

- [ ] Implementasikan `GET /r/:shortCode`.
- [ ] Lookup campaign dengan cache opsional.
- [ ] Cek active window, status, dan expiry.
- [ ] Implementasikan device/country/IP policy yang terdokumentasi.
- [ ] Implementasikan redirect outcome `TARGET`, `BLOCKED`, `EXPIRED`, `NOT_FOUND`.
- [ ] Tambahkan timeout dan failover behavior.
- [ ] Tambahkan integration test untuk semua outcome.

### Phase 4 — Analytics MVP

- [ ] Buat `ClickEvent` dengan field minimal.
- [ ] Buat aggregate harian `DailyCampaignMetric`.
- [ ] Tambahkan dashboard cards dan time-series chart.
- [ ] Tambahkan top campaign/table.
- [ ] Tambahkan device/country/referrer aggregate.
- [ ] Tambahkan retention cleanup.
- [ ] Pastikan analytics tidak memperlambat redirect.

### Phase 5 — Admin dan Governance

- [ ] User list dan search.
- [ ] Invite user.
- [ ] Edit role/status.
- [ ] Suspend/reactivate/delete.
- [ ] Global settings.
- [ ] Audit log viewer.
- [ ] Abuse report dan campaign kill switch.

### Phase 6 — Tracking Integrations

- [ ] Definisikan consent model.
- [ ] Tambahkan GA4 secara opt-in.
- [ ] Tambahkan Meta/TikTok provider sesuai kebijakan masing-masing.
- [ ] Tambahkan event mapping.
- [ ] Simpan hanya konfigurasi yang diperlukan.
- [ ] Test provider failure tanpa menggagalkan redirect.

### Phase 7 — Performance dan Reliability

- [ ] Tambahkan Upstash rate limiting.
- [ ] Tambahkan cache campaign aktif.
- [ ] Load test redirect endpoint.
- [ ] Ukur p95/p99 latency.
- [ ] Tambahkan queue untuk aggregation jika diperlukan.
- [ ] Tambahkan retry/dead-letter handling.
- [ ] Uji cold start dan batas execution Vercel.

### Phase 8 — Production Hardening

- [x] Tambahkan security headers global dan request correlation ID.
- [x] Fail-closed internal health endpoint dengan token wajib.
- [x] Hilangkan wildcard CORS pada API same-origin.
- [x] Security review awal dan dependency audit dijalankan.
- [x] SSRF-style URL validation test ditambahkan.
- [ ] Remediasi dependency advisory transitive dan lockfile refresh.
- [x] Authorization matrix test dasar.
- [ ] Penetration test untuk endpoint penting.
- [ ] Backup/restore drill.
- [x] Monitoring dan alert checklist.
- [x] Runbook incident response.
- [ ] Staged rollout dengan custom domain.

#### Environment checklist sebelum deploy Vercel

Wajib:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `NUXT_SESSION_PASSWORD`
- `PUBLIC_SITE_URL` dengan domain HTTPS milik sendiri
- `TRACKING_SECRET`
- `INTERNAL_HEALTH_TOKEN`

Opsional, aktif hanya jika dikonfigurasi:

- `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN`
- `CLOUDAMQP_URL`
- `GA4_API_SECRET`
- `META_CAPI_ACCESS_TOKEN`
- `TIKTOK_ACCESS_TOKEN`

- Jangan memasukkan secret ke `runtimeConfig.public`, repository, atau URL query string.

### Phase 9 — Release Readiness

- [x] Pastikan asset `robots.txt` tersedia pada path production.
- [x] Jalankan production build penuh dengan environment Vercel staging-like environment.
- [ ] Jalankan smoke test login, campaign CRUD, redirect, dan health check.
- [ ] Verifikasi custom domain dan HTTPS redirect.
- [ ] Verifikasi migration database production.
- [ ] Lakukan staged rollout dan rollback drill.
- [ ] Tinjau ulang dependency advisory sebelum go-live.

### Phase 10 — Campaign Rule Builder

- [x] Tambahkan schema `ruleConfig` untuk device, country, IP/CIDR, dan bot.
- [x] Persist rule config pada create dan edit campaign.
- [x] Tambahkan UI allow/exclude device dan country.
- [x] Tambahkan UI allow/exclude IP/CIDR dan bot blocking.
- [x] Terapkan fail-closed untuk allow-list dan malformed rule config.
- [x] Tambahkan security test untuk rule evaluation dan validation.
- [x] Validasi typecheck dan production build.
- [ ] Jalankan authenticated API smoke test pada deployment Preview.

### Phase 11 — Multi-Destination Affiliate Rotator

- [x] Tambahkan daftar hingga 50 target HTTPS pada campaign.
- [x] Simpan daftar target dengan migration yang backfill campaign lama.
- [x] Pilih destination secara random pada setiap redirect yang lolos rules.
- [x] Pertahankan fallback kompatibel untuk campaign legacy.
- [x] Tampilkan dan edit kembali seluruh destination pada dashboard.
- [x] Tambahkan test validasi URL dan pemilihan target yang aman.
- [x] Perbarui API smoke test untuk memverifikasi pool target.
- [ ] Jalankan migration dan authenticated API smoke test pada deployment Preview.

---

## 11. Testing Strategy

### Unit test

- Short code generator.
- URL normalization.
- Scheme/domain validation.
- CIDR matching.
- Device classification.
- Rule evaluation.
- Attribution extraction dan sanitization.
- HMAC/signed token.

### Integration test

- Campaign CRUD.
- Ownership dan role authorization.
- Redirect target/blocked/expired.
- Rate limit.
- Analytics event creation.
- User invitation.
- Audit log.

### End-to-end test

- Login.
- Create campaign.
- Preview short link.
- Click short link dengan device/country simulation.
- Lihat analytics dashboard.
- Admin invite dan suspend user.

### Security test

- Open redirect.
- SSRF URL validation dasar.
- IDOR/BOLA.
- XSS pada campaign name/URL metadata.
- SQL injection melalui filter/search.
- Rate limit bypass.
- Session fixation.
- Privilege escalation.
- Header/query log leakage.

---

## 12. Definition of Done MVP

MVP dianggap siap jika:

- User dapat login dan hanya melihat campaign miliknya.
- User dapat create/edit/pause/archive campaign.
- Short URL menggunakan domain milik aplikasi.
- Target URL tervalidasi dan tidak dapat menjadi open redirect.
- Redirect menghormati status campaign dan expiry.
- Blocked destination bekerja berdasarkan rule yang terdokumentasi.
- Click event tercatat tanpa menunggu analytics berat.
- Dashboard menampilkan total click dan trend dasar.
- Admin dapat invite, suspend, dan mengubah role user.
- Semua mutasi penting masuk audit log.
- Rate limit aktif pada endpoint berisiko.
- Privacy/retention policy tersedia.
- Unit dan integration test utama lulus.
- Deployment Preview dan Production Vercel terdokumentasi.

---

## 13. Keputusan yang Perlu Dikunci Sebelum Coding

1. Apakah short domain akan menggunakan subdomain utama atau domain terpisah?
2. Apakah target URL hanya `https://` atau `http://` juga diperbolehkan?
3. Provider GeoIP apa yang akan digunakan?
4. Apakah analytics membutuhkan raw event atau cukup agregat harian?
5. Berapa retention event detail dan aggregate?
6. Apakah campaign boleh memiliki beberapa destination?
7. Apakah blocked rule bersifat `allowlist` atau `exclude list`?
8. Apakah tracking provider memerlukan consent banner?
9. Apakah Redis diperlukan sejak MVP atau ditunda?
10. Apakah queue diperlukan sejak MVP atau setelah ada volume nyata?
11. Provider email untuk invitation dan verification?
12. Apakah pengguna dapat membawa custom domain sendiri?

---

## 14. Urutan Implementasi yang Direkomendasikan

Urutan paling aman dan bernilai:

1. Authentication + authorization.
2. Campaign CRUD + URL validation.
3. Own-domain redirect engine.
4. Basic click analytics.
5. Dashboard overview.
6. Admin user management.
7. Device/country rules.
8. Rate limit dan abuse controls.
9. Tracking integrations berbasis consent.
10. Redis cache dan queue hanya setelah profiling.

Jangan mulai dari rotasi token atau integrasi tracking. Fondasi yang benar adalah validasi destination, ownership, redirect security, privacy, auditability, dan observability.
