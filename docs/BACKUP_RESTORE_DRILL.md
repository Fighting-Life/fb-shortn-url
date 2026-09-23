# Neon PostgreSQL Backup and Restore Drill

Dokumen ini adalah prosedur staging untuk membuktikan bahwa backup database dapat dipulihkan. Jangan menjalankan restore ke production tanpa approval dan backup tambahan.

## Prasyarat

- `pg_dump` dan `pg_restore` tersedia pada workstation atau CI runner.
- Connection string Neon staging tersedia melalui secret manager.
- Database restore target berbeda dari production.
- Window maintenance dan owner incident sudah ditentukan.

Jangan menyimpan connection string dalam file yang di-commit atau command history yang dibagikan.

## 1. Buat backup logical

Gunakan connection string dari secret manager:

```bash
pg_dump "$DATABASE_URL_UNPOOLED" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file=backup-YYYYMMDD-HHmm.dump
```

Catat metadata berikut tanpa mencatat secret:

- Waktu backup.
- Environment/database identifier.
- Ukuran file.
- Git commit atau migration terakhir.
- SHA-256 file backup.

Contoh checksum:

```bash
sha256sum backup-YYYYMMDD-HHmm.dump
```

## 2. Restore ke staging kosong

Pastikan target bukan production, lalu bersihkan database staging melalui prosedur DBA yang disetujui. Restore backup:

```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="$STAGING_DATABASE_URL" \
  backup-YYYYMMDD-HHmm.dump
```

Jangan memakai `prisma migrate reset` pada database production.

## 3. Verifikasi restore

Jalankan:

```bash
DATABASE_URL="$STAGING_DATABASE_URL" pnpm db:migrate:status
DATABASE_URL="$STAGING_DATABASE_URL" pnpm db:validate
```

Smoke test minimum:

1. Login user test.
2. Campaign list.
3. Campaign preview.
4. Redirect target.
5. Redirect blocked rule.
6. Dashboard analytics.
7. Admin audit log.

Jika schema staging berasal dari backup yang lebih lama, migration pending harus direview sebelum dijalankan:

```bash
DATABASE_URL="$STAGING_DATABASE_URL" pnpm db:migrate:deploy
```

## 4. Kriteria berhasil

Drill dianggap berhasil jika:

- Backup dapat dibaca dan checksum tercatat.
- Restore selesai tanpa error.
- Migration status dapat diperiksa.
- User, campaign, audit log, dan analytics sample tersedia.
- Smoke test lulus.
- Waktu restore dan ukuran backup tercatat.
- Tidak ada secret atau raw credential pada log/artifact.

## 5. Jadwal dan retensi

- Lakukan drill minimal setiap kuartal dan setelah perubahan schema besar.
- Simpan backup sesuai kebijakan retensi dan kebutuhan hukum.
- Simpan backup di lokasi terpisah dari database utama.
- Uji akses restore hanya dengan role yang diperlukan.
- Setelah drill, hapus database staging dan artifact sensitif sesuai kebijakan.
