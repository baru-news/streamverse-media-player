# Integrasi Doodstream - Panduan Lengkap

## Daftar Isi
1. [Persiapan](#persiapan)
2. [Konfigurasi API](#konfigurasi-api)
3. [Fitur yang Tersedia](#fitur-yang-tersedia)
4. [Workflow Upload](#workflow-upload)
5. [Troubleshooting](#troubleshooting)

## Persiapan

### 1. Yang Diperlukan dari Doodstream

**Akun dan Kredensial:**
- Akun Doodstream aktif (berbayar untuk fitur upload)
- API Key dari dashboard Doodstream
- Access ke https://doodapi.com/api/

**Informasi Tambahan:**
- Account ID atau User ID
- Premium status (untuk fitur advanced)
- Storage quota dan bandwidth limits

### 2. Struktur Integrasi

```
src/
├── lib/
│   ├── doodstream.ts              # Client-side API wrapper
│   └── supabase-doodstream.ts     # Secure server-side API
├── components/
│   ├── VideoUpload.tsx            # Upload interface
│   ├── DoodstreamPlayer.tsx       # Video player component
│   └── VideoCard.tsx              # Video display card
├── pages/
│   ├── AdminUpload.tsx            # Admin dashboard
│   └── VideoDetail.tsx            # Video detail with player
└── supabase/functions/
    └── doodstream-api/            # Edge function for API calls
        └── index.ts
```

## Konfigurasi API

### Step 1: Integrasikan Supabase

**PENTING:** Untuk keamanan, API key harus disimpan di Supabase secrets, bukan di kode.

1. Klik tombol "Integrasikan Supabase" di atas
2. Setelah integrasi selesai, tambahkan secret:

```bash
# Di Supabase Dashboard > Project Settings > API > Secrets
DOODSTREAM_API_KEY=your_actual_api_key_here
```

### Step 2: Konfigurasi Edge Function

Edge function sudah dibuat di `supabase/functions/doodstream-api/index.ts`. Ini akan:
- Menyimpan API key dengan aman di server
- Membatasi akses ke API Doodstream
- Memproses response untuk keamanan

### Step 3: Aktifkan Kode

Setelah Supabase terintegrasi, uncomment kode di `src/lib/supabase-doodstream.ts`:

```typescript
// Ubah ini:
// import { supabase } from "@/integrations/supabase/client";

// Menjadi:
import { supabase } from "@/integrations/supabase/client";
```

## Fitur yang Tersedia

### 1. Upload Video
- **Lokasi:** `/admin/upload`
- **Format:** MP4, AVI, MKV, MOV (maksimal 2GB)
- **Fitur:** Progress tracking, validation, error handling

### 2. Video Player
- **Component:** `DoodstreamPlayer`
- **Fitur:** Responsive, lazy loading, error handling
- **URL Format:** `https://dood.re/e/{fileCode}`

### 3. Video Management
- **Lokasi:** Admin dashboard
- **Fitur:** List videos, view stats, copy links

### 4. Account Information
- **Data:** Balance, storage, premium status
- **Update:** Real-time via API

## Workflow Upload

### Proses Upload Otomatis:

1. **User memilih file** → Validasi format dan ukuran
2. **Request upload server** → Edge function call ke Doodstream
3. **Upload file** → Direct upload ke Doodstream server
4. **Get file code** → Unique identifier dari Doodstream
5. **Save to database** → Store metadata di Supabase (optional)
6. **Generate embed** → Create player link

### Kode Contoh:

```typescript
// Upload video
const result = await doodstream.uploadVideo(file, title);

if (result.success) {
  const fileCode = result.file_code;
  const embedUrl = `https://dood.re/e/${fileCode}`;
  
  // Save to your database
  await saveVideoToDatabase({
    fileCode,
    title,
    embedUrl,
    status: 'processing'
  });
}
```

## Mengambil Link Embed

### 1. Dari File Code:
```typescript
const fileCode = "abc123def456";
const embedUrl = `https://dood.re/e/${fileCode}`;
```

### 2. Dengan Autoplay:
```typescript
const embedUrl = `https://dood.re/e/${fileCode}?autoplay=1`;
```

### 3. Generate HTML:
```typescript
const embedHTML = `<iframe src="https://dood.re/e/${fileCode}" 
  width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
```

## API Endpoints yang Digunakan

### 1. Account Info
```
GET https://doodapi.com/api/account/info?key={API_KEY}
```

### 2. Upload Server
```
GET https://doodapi.com/api/upload/server?key={API_KEY}
```

### 3. File List
```
GET https://doodapi.com/api/file/list?key={API_KEY}&page=1&per_page=10
```

### 4. File Info
```
GET https://doodapi.com/api/file/info?key={API_KEY}&file_code={FILE_CODE}
```

### 5. Direct Link (Premium)
```
GET https://doodapi.com/api/file/direct_link?key={API_KEY}&file_code={FILE_CODE}
```

## Sample Authentication Code

```typescript
import { DoodstreamAPI } from '@/lib/doodstream';

// Initialize API
const doodstream = new DoodstreamAPI(apiKey);

// Test connection
const accountInfo = await doodstream.getAccountInfo();
if (accountInfo) {
  console.log('Connected successfully:', accountInfo.email);
} else {
  throw new Error('Authentication failed');
}

// Get video list
const videos = await doodstream.getVideoList(1, 10);
console.log(`Found ${videos.length} videos`);

// Get specific video info
const videoInfo = await doodstream.getVideoInfo('file_code_here');
if (videoInfo) {
  console.log('Video title:', videoInfo.title);
  console.log('Embed URL:', videoInfo.embed_url);
}
```

## Troubleshooting

### Problem: "API key not configured"
**Solution:** 
1. Pastikan Supabase sudah terintegrasi
2. Tambahkan `DOODSTREAM_API_KEY` di Supabase secrets
3. Restart aplikasi

### Problem: "Upload failed"
**Possible causes:**
- File format tidak didukung
- File terlalu besar (>2GB)
- API quota habis
- Network timeout

### Problem: "Video not loading"
**Check:**
- File code benar
- Video sudah selesai diproses di Doodstream
- Embed URL dapat diakses

### Problem: "Direct link not working"
**Requirement:**
- Butuh akun premium Doodstream
- API key harus memiliki akses direct link

## Status Video di Doodstream

- `processing` - Video sedang diproses
- `active` - Video siap untuk streaming
- `inactive` - Video tidak aktif
- `banned` - Video melanggar kebijakan

## Rate Limits

Doodstream memiliki rate limiting:
- Upload: Terbatas berdasarkan account type
- API calls: ~1000 requests per hour
- Bandwidth: Sesuai package yang dipilih

## Tips Optimasi

1. **Upload:**
   - Kompres video sebelum upload
   - Gunakan format MP4 untuk kompatibilitas terbaik
   - Upload di luar jam sibuk

2. **Player:**
   - Lazy load player untuk performa
   - Cache file code di database
   - Implement fallback untuk error

3. **Management:**
   - Sync status video secara berkala
   - Monitor storage usage
   - Backup file code dan metadata

## Keamanan

- ✅ API key disimpan di Supabase secrets
- ✅ Request melalui edge functions
- ✅ Validasi file type dan size
- ✅ Error handling yang aman
- ✅ CORS protection

## Monitoring

Pantau metrics berikut:
- Upload success rate
- Video processing time
- Player load errors
- API response times
- Storage usage

---

**Catatan:** Integrasi ini membutuhkan akun Doodstream berbayar dan Supabase integration yang aktif. Pastikan kedua layanan sudah dikonfigurasi dengan benar sebelum production.