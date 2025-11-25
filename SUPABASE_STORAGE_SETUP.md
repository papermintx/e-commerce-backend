# Supabase Storage Setup Guide

## Error yang Terjadi
```
StorageApiError: new row violates row-level security policy
status: 400, statusCode: '403'
```

Ini berarti bucket `products` di Supabase Storage belum dikonfigurasi dengan benar atau RLS policy memblokir upload.

## Solusi: Konfigurasi Supabase Storage

### Step 1: Buka Supabase Dashboard
1. Login ke https://supabase.com/dashboard
2. Pilih project Anda
3. Navigasi ke **Storage** di sidebar kiri

### Step 2: Buat Bucket `products` (jika belum ada)
1. Klik **"New bucket"**
2. Nama bucket: `products`
3. **Public bucket**: ✅ **CENTANG INI** (untuk public access ke gambar)
4. **File size limit**: 5 MB (opsional)
5. **Allowed MIME types**: `image/jpeg,image/png,image/webp` (opsional)
6. Klik **"Create bucket"**

### Step 3: Setup Row-Level Security (RLS) Policies

#### Option A: Public Bucket (Recommended untuk Product Images)
Jika Anda sudah centang "Public bucket" saat create, bucket sudah bisa diakses public untuk READ. Tapi untuk UPLOAD, kita perlu policy khusus:

1. Di Supabase Dashboard, buka **Storage** → klik bucket `products`
2. Klik tab **"Policies"**
3. Klik **"New policy"**

**Policy 1: Allow Authenticated Users to Upload**
```sql
-- Policy Name: Allow authenticated users to upload
-- Operation: INSERT
-- Policy Definition:
(bucket_id = 'products'::text) AND (auth.role() = 'authenticated'::text)
```

**Policy 2: Allow Public Read Access**
```sql
-- Policy Name: Public read access
-- Operation: SELECT
-- Policy Definition:
(bucket_id = 'products'::text)
```

**Policy 3: Allow Authenticated Users to Update**
```sql
-- Policy Name: Allow authenticated users to update
-- Operation: UPDATE
-- Policy Definition:
(bucket_id = 'products'::text) AND (auth.role() = 'authenticated'::text)
```

**Policy 4: Allow Authenticated Users to Delete**
```sql
-- Policy Name: Allow authenticated users to delete
-- Operation: DELETE
-- Policy Definition:
(bucket_id = 'products'::text) AND (auth.role() = 'authenticated'::text)
```

#### Option B: Setup via SQL Editor (Lebih Cepat)
1. Buka **SQL Editor** di Supabase Dashboard
2. Jalankan SQL berikut:

```sql
-- Create bucket if not exists (skip if already created via UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;

-- Policy 1: Allow authenticated users to INSERT (upload)
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Policy 2: Allow public SELECT (read/download)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Policy 3: Allow authenticated users to UPDATE
CREATE POLICY "Allow authenticated users to update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');

-- Policy 4: Allow authenticated users to DELETE
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
```

### Step 4: Verifikasi Konfigurasi

1. **Cek bucket exists**:
```sql
SELECT * FROM storage.buckets WHERE id = 'products';
```

2. **Cek policies active**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

3. **Test upload via Supabase Dashboard**:
   - Buka Storage → products bucket
   - Clik "Upload file"
   - Coba upload gambar test
   - Jika berhasil, konfigurasi sudah benar ✅

### Step 5: Test dari Backend

Setelah konfigurasi di atas, restart server dan test create product lagi:

```bash
POST http://localhost:3000/api/admin/products
Authorization: Bearer {{admin_token}}

Body (form-data):
- name: "Test Product"
- description: "Test description for product"
- price: "100000"
- stock: "10"
- category_id: "<your-category-id>"
- sku: "TEST-001"
- sizes: ["M","L"]
- colors: ["Merah"]
- images: [Upload 1 gambar test]
```

## Troubleshooting

### Error: "Bucket not found"
- Pastikan bucket `products` sudah dibuat
- Cek nama bucket di `.env`: `SUPABASE_STORAGE_BUCKET_PRODUCTS=products`

### Error: "Invalid JWT"
- Token JWT dari Supabase Auth harus valid
- Pastikan header `Authorization: Bearer <token>` dikirim dengan benar
- Token harus dari user yang sudah login (authenticated)

### Error: "File size too large"
- Default limit: 5MB per file (dikonfigurasi di `upload.service.js`)
- Jika ingin ubah, edit `maxSize` di multer config

### Error: "Invalid file type"
- Hanya accept: JPEG, PNG, WebP
- Edit `fileFilter` di `upload.service.js` jika ingin tambah format

## Environment Variables

Pastikan `.env` berisi:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET_PRODUCTS=products
```

## Alternative: Disable RLS untuk Testing (NOT RECOMMENDED FOR PRODUCTION)

Jika hanya untuk testing lokal dan ingin bypass RLS sementara:

```sql
-- WARNING: Ini membuat bucket completely public (read/write)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

⚠️ **JANGAN gunakan ini di production!** Siapapun bisa upload/delete file.

Untuk enable kembali:
```sql
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

## Summary

✅ **Checklist:**
- [ ] Bucket `products` created dengan public = true
- [ ] RLS policies untuk INSERT/SELECT/UPDATE/DELETE sudah dibuat
- [ ] Policy allow authenticated users untuk upload
- [ ] Policy allow public untuk read
- [ ] Test upload via Supabase Dashboard berhasil
- [ ] Environment variables sudah benar
- [ ] JWT token valid dari authenticated user

Setelah semua checklist complete, test create product dari Postman akan berhasil! 🎉
