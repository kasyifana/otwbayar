# Product Requirements Document (PRD)
# otwglamping — Shared Expense & Group Saving Tracker

---

## Document Control
- **Product Name:** otwglamping
- **Document Version:** 1.0.0
- **Status:** Approved for Implementation
- **Target Audience:** Fullstack Engineer, UI/UX Designer, QA
- **Target Release:** MVP V1
- **Architecture:** Monorepo (Next.js App Router fullstack, single-deployment on Vercel)
- **Primary Data Layer:** Neon.tech Serverless PostgreSQL
- **Asset Storage:** Vercel Blob Storage
- **Authentication Strategy:** Magic Invite Token via URL (Zero friction, no passwords)

---

## 1. Executive Summary & Context

### 1.1 Problem Statement
Perencanaan liburan kelompok (seperti glamping 5–10 orang) sering berantakan karena faktor finansial:
1. **Awkwardness Menagih:** Koordinator (bendahara) enggan menagih patungan secara terus-menerus di grup chat.
2. **Tabungan Ghaib:** Uang patungan tercampur dengan rekening pribadi bendahara tanpa transparansi pencatatan.
3. **Dropout Mendadak:** Anggota membatalkan keikutsertaan di H-minus beberapa hari saat uang DP tenda sudah terbayar.
4. **Chaos Hari-H:** Nota makan malam BBQ, arang, sewa alat, dan tiket masuk tercecer sehingga split bill pasca-trip menjadi sengketa.

### 1.2 Value Proposition
**otwglamping** adalah tracker tabungan kelompok dan split bill on-site yang menghilangkan kecanggungan finansial lewat transparansi real-time, visualisasi kesiapan kelompok ("Siap Berangkat"), dan alur pembayaran QRIS statis yang ringkas tanpa beban login akun.

### 1.3 Core Success Metrics (KPIs)
| Metric | Baseline / Target | Cara Pengukuran |
|---|---|---|
| **Group Goal Completion Rate** | $\ge 80\%$ grup mencapai $100\%$ target sebelum H-7 trip | Persentase `groups` dengan status `funded` |
| **Verification Latency** | $< 12$ jam dari unggah bukti hingga approval koordinator | Selisih `approved_at` - `submitted_at` di `payment_proofs` |
| **Activity Feed Engagement** | $\ge 3$ kunjungan per member per minggu | Pageview unik per `member_token` via web analytics |
| **On-site Expense Log Ratio** | $\ge 90\%$ pengeluaran tak terduga tercatat sebelum trip selesai | Total pengeluaran `expenses` terinput vs settlement |

---

## 2. User Roles & Personas

### 2.1 Persona Matrix
| Atribut | Koordinator (Trip Lead / Bendahara) | Member (Peserta Glamping) |
|---|---|---|
| **Role Code** | `COORDINATOR` | `MEMBER` |
| **Archetype** | "Si Paling Pengatur" (e.g., Sarah, 26) | "Si Santai Ikut Aja" (e.g., Dimas, 25) |
| **Goal** | Dana terkumpul tepat waktu tanpa stres menagih; nota rapi | Tahu berapa yang harus dibayar, kapan deadline, bukti bayar aman |
| **Pain Point** | Rekening pribadi campur aduk; spreadsheet rumit di HP | Malu ditagih di grup besar; lupa sudah cicil berapa kali |
| **Access Rights** | Full CRUD: edit budget, set target, approve/reject bukti bayar, log expense, trigger invite link | Read group state, upload bukti transfer ke QRIS, tambah log belanja on-site |
| **Auth Mode** | Magic token URL koordinator (`?token=coord_xyz`) | Magic token URL member unik (`?token=mem_abc`) |

---

## 3. End-to-End User Journey

```text
[1. INISIASI]
Coordinator buka web -> Input Nama Trip ("Glamping Ciwidey"), Target Total, Deadline, 
Upload Screenshot QRIS Statis -> Generate Magic Invite Links (7 Member)
       |
       v
[2. ONBOARDING & INVITE]
Coordinator share link via WhatsApp -> Member klik link -> Langsung landing di Dashboard
tanpa registrasi/password -> Avatar aktif otomatis sesuai slot member
       |
       v
[3. BREAKDOWN POS BIAYA]
Pos biaya transparan: Tenda Glamping Safari, Paket BBQ & Bahan Makanan, Transport & Bensin, Dana Darurat
       |
       v
[4. SIKLUS MENABUNG (PRE-TRIP)]
Member lihat target cicilan -> Buka tab Setor -> Scan QRIS -> Transfer via Bank/E-Wallet 
-> Upload screenshot struk -> Status: "Menunggu Verifikasi"
       |
       v
[5. VERIFIKASI KOORDINATOR]
Koordinator dapat notif email -> Cek mutasi rekening -> Klik "Approve" 
-> Progress bar pool bertambah -> Badge member berubah jadi "Siap Berangkat"
       |
       v
[6. HARI-H GLAMPING & ON-SITE SPLITTER]
Belanja arang/kayu bakar dadakan di warung lokal -> Siapa pun bisa foto struk & input nominal
-> Sistem kalkulasi auto-split rata atau pemotongan dari Pos Dana Darurat
       |
       v
[7. POST-TRIP SETTLEMENT]
Sisa dana pool dikembalikan (refund) atau kekurangan ditagihkan otomatis secara prorata.
```

---

## 4. System Architecture & Tech Stack

Aplikasi dirancang sebagai **Single Repository Fullstack Web Application** yang di-deploy di Vercel:

```text
otwglamping (Next.js App Router Monorepo)
├── Frontend: React 19, Tailwind CSS v4, Lucide Icons
├── Client State & Caching: TanStack React Query v5
├── Backend: Next.js API Routes / Server Actions
├── Database: Neon.tech (Serverless PostgreSQL via `@neondatabase/serverless`)
├── Storage: Vercel Blob (`@vercel/blob`) untuk bukti bayar & QRIS statis
└── Email Service: Resend API untuk notifikasi transactional V1
```

### 4.1 Trade-off & Engineering Decisions
1. **Magic Link URLs over Session Auth:** Mengeliminasi sign-up friction untuk kelompok liburan santai. Security level berbasis UUIDv4 + cryptographic token yang disimpan di database.
2. **Integer Currency Representation:** Seluruh kalkulasi nominal uang disimpan dalam satuan Rupiah integer penuh (`BIGINT` / `INTEGER` tanpa desimal). Hindari floating point error (e.g., `Rp 150.000` disimpan sebagai `150000`).
3. **Client-side Compression:** Gambar bukti transfer dikompresi di browser (max width 1600px, quality 0.8 WebP) sebelum diunggah ke Vercel Blob untuk menghemat bandwidth mobile dan kuota storage.

---

## 5. Functional Requirements & Acceptance Criteria

### Feature 1: Group Goal & Budget Allocation
- **Deskripsi:** Koordinator mendefinisikan target total, tanggal trip, slot kuota peserta (default 7 orang), serta pos-pos alokasi biaya utama.
- **User Story:** *Sebagai Koordinator, saya ingin membuat grup trip glamping dengan target biaya terinci agar seluruh peserta paham alokasi dana secara transparan.*

#### Acceptance Criteria:
```gherkin
Scenario: Koordinator berhasil menginisiasi grup dan breakdown biaya
  Given Koordinator mengakses halaman pembuatan trip
  When mengisi form:
    | Field | Value |
    | Nama Grup | Glamping Riverside Pangalengan |
    | Tanggal Trip | 2025-06-20 |
    | Jumlah Member | 7 |
    | Pos Tenda Safari | 2800000 |
    | Pos BBQ & Bahan Makanan | 1400000 |
    | Pos Transportasi | 1050000 |
    | Pos Dana Darurat | 350000 |
  And mengunggah gambar QRIS statis
  Then sistem membuat entitas grup baru di Neon DB
  And total target terkalkulasi otomatis menjadi Rp 5.600.000 (Rp 800.000 per member)
  And sistem membuat 7 token unik anggota dan 1 token khusus koordinator
  And mengarahkan koordinator ke Group Management Hub
```

### Feature 2: Shared Pool Dashboard
- **Deskripsi:** Dashboard pusat real-time berisi visual progress bar, metrik uang terkumpul vs target, countdown hari menuju trip, dan quick action setor.
- **User Story:** *Sebagai Peserta maupun Koordinator, saya ingin melihat progress tabungan bersama dan countdown waktu agar termotivasi melunasi iuran sebelum hari H.*

#### Acceptance Criteria:
```gherkin
Scenario: Menampilkan status pool tabungan terkini
  Given grup dengan total target Rp 5.600.000
  And total kontribusi terverifikasi adalah Rp 3.920.000
  When user membuka dashboard via magic link
  Then progress bar menampilkan persentase 70%
  And metrik terkumpul tertulis "Rp 3.920.000 / Rp 5.600.000"
  And komponen countdown menampilkan sisa hari menuju tanggal trip
  And jika sisa hari <= 7 dan target belum 100%, tampilkan alert banner urgensi pelunasan
```

### Feature 3: Member Contribution Grid
- **Deskripsi:** Grid visual 7 avatar peserta dengan status setoran masing-masing, persentase kontribusi per orang, dan indikator lunas.
- **User Story:** *Sebagai Peserta, saya ingin melihat status iuran saya dan teman-teman satu tenda agar timbul rasa tanggung jawab sosial bersama.*

#### Acceptance Criteria:
```gherkin
Scenario: Menampilkan status badge member
  Given kuota target per orang adalah Rp 800.000
  When member A telah terverifikasi menyetor Rp 800.000
  And member B telah menyetor Rp 400.000 (approved)
  And member C menyetor Rp 400.000 (status pending verification)
  And member D belum menyetor sama sekali (Rp 0)
  Then avatar Member A memiliki badge hijau "Siap Berangkat"
  And avatar Member B memiliki badge kuning "Cicilan 50%"
  And avatar Member C memiliki badge oranye "Menunggu Verifikasi"
  And avatar Member D memiliki badge merah "Belum Setor"
```

### Feature 4: Static QRIS Display & Payment Proof Vault
- **Deskripsi:** Halaman setor yang menampilkan barcode QRIS statis koordinator, instruksi transfer, upload picker bukti transfer, serta antarmuka approval untuk koordinator.
- **User Story:** *Sebagai Member, saya ingin memindai QRIS dan mengunggah bukti bayar agar setoran saya segera diverifikasi oleh Koordinator.*
- **User Story (Koordinator):** *Sebagai Koordinator, saya ingin melihat daftar bukti bayar yang masuk dan menyetujuinya dengan 1 klik agar saldo pool bertambah.*

#### Acceptance Criteria:
```gherkin
Scenario: Member mengunggah bukti transfer
  Given Member mengakses tab "Setor Dana"
  When Member mengunggah file bukti transfer berekstensi .png/.jpg/.webp berukuran 2.4MB
  And menginput nominal setoran Rp 400.000 serta catatan "Cicilan 1 Dimas"
  Then file terunggah ke Vercel Blob
  And record payment_proof tersimpan dengan status 'PENDING'
  And dashboard member menampilkan toast "Bukti berhasil dikirim, menunggu verifikasi Sarah"
  And sistem mengirimkan 1 email notifikasi ke koordinator

Scenario: Koordinator menyetujui bukti transfer
  Given Koordinator melihat antrean 1 bukti setoran pending dari Dimas sebesar Rp 400.000
  When Koordinator menekan tombol "Approve"
  Then status bukti transfer berubah menjadi 'APPROVED'
  And total terkumpul grup bertambah Rp 400.000
  And total kontribusi Dimas terupdate di tabel members
  And sistem mengirimkan email konfirmasi ke Dimas bahwa setorannya telah diterima
```

### Feature 5: On-site Expense Logger & Split Bill
- **Deskripsi:** Pencatatan nota belanja dadakan saat trip (misal: arang, es batu, snack) dengan opsi: diambil dari kas bersama (pool) atau ditanggung talangan salah satu member.
- **User Story:** *Sebagai Peserta di lokasi glamping, saya ingin mencatat pembelian dadakan yang saya talangi agar uang saya diganti dari kas bersama atau dibagi rata.*

#### Acceptance Criteria:
```gherkin
Scenario: Mencatat pengeluaran talangan member saat glamping
  Given Member Dimas membeli arang & briket seharga Rp 70.000 di warung lokal
  When Dimas mengunggah foto nota dan memilih opsi "Ditalangi oleh Dimas (Split ke 7 Orang)"
  Then sistem membuat record expense sebesar Rp 70.000
  And sistem menghitung beban per orang Rp 10.000
  And neraca kas menampilkan ringkasan Dimas berhak menerima reimbursement Rp 60.000 dari kas pool
```

---

## 6. Data Model & Database Schema (PostgreSQL Neon)

Semua tabel menggunakan identifikasi `cuid2` atau `uuid` dan timestamp timezone-aware UTC.

```sql
-- ENUMS
CREATE TYPE role_type AS ENUM ('COORDINATOR', 'MEMBER');
CREATE TYPE proof_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE expense_source AS ENUM ('POOL_FUND', 'MEMBER_REIMBURSE');

-- 1. GROUPS TABLE
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    trip_date DATE NOT NULL,
    target_amount BIGINT NOT NULL DEFAULT 0, -- Dalam satuan Rupiah penuh
    current_amount BIGINT NOT NULL DEFAULT 0,
    qris_image_url TEXT NOT NULL,
    coordinator_token VARCHAR(64) UNIQUE NOT NULL,
    invite_code VARCHAR(16) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BUDGET CATEGORIES (Breakdown Pos)
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g., 'Tenda Glamping', 'BBQ', 'Transport'
    allocated_amount BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MEMBERS TABLE
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    role role_type NOT NULL DEFAULT 'MEMBER',
    member_token VARCHAR(64) UNIQUE NOT NULL,
    target_quota BIGINT NOT NULL DEFAULT 0,
    paid_amount BIGINT NOT NULL DEFAULT 0,
    avatar_color VARCHAR(10) DEFAULT '#10b981',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PAYMENT PROOFS (Vault Setoran)
CREATE TABLE payment_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    proof_image_url TEXT NOT NULL,
    note VARCHAR(255),
    status proof_status NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES members(id)
);

-- 5. ON-SITE EXPENSES (Nota Pengeluaran Hari-H)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    paid_by_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
    title VARCHAR(100) NOT NULL,
    amount BIGINT NOT NULL,
    receipt_image_url TEXT,
    source expense_source NOT NULL DEFAULT 'POOL_FUND',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 7. API Specification (Next.js App Router API Routes)

Semua endpoint beroperasi di namespace `/api/v1` dan divalidasi dengan token URL di header atau query parameter: `Authorization: Bearer <magic_token>`.

### 7.1 Group & Dashboard
- `POST /api/v1/groups` — Membuat trip baru + upload QRIS + inisiasi member slots.
- `GET /api/v1/groups/:id?token=xyz` — Mengambil data agregasi dashboard (info trip, pool balance, member grid, countdown).

### 7.2 Contribution & Payment Proofs
- `POST /api/v1/payments/upload` — Direct presigned URL atau buffer upload ke Vercel Blob untuk screenshot bukti.
- `POST /api/v1/payments/submit` — Submit record bukti transfer (`amount`, `imageUrl`, `note`).
- `PATCH /api/v1/payments/:id/verify` — Approval/rejection oleh koordinator (`status: 'APPROVED' | 'REJECTED'`).

### 7.3 Expense Logging
- `POST /api/v1/expenses` — Tambah catatan pengeluaran belanja on-site + upload nota.
- `GET /api/v1/expenses?groupId=xyz` — Daftar seluruh nota pengeluaran dan rincian split-bill settlement.

---

## 8. UI/UX Design Direction & Screen Breakdown

### 8.1 Aesthetic & Visual Voice
- **Tone:** Casual, fresh, grounded outdoor adventure. Menghadirkan rasa sejuk pegunungan, wangi pinus, api unggun malam hari, dan kehangatan persahabatan.
- **Color Palette (Earth & Campfire):**
  - **Forest Green (Primary):** `#1E3F20` (Forest 900) & `#2D5A27` (Forest 700) — dominan untuk bar progress dan brand header.
  - **Campfire Amber (Accent):** `#E07A5F` & `#F2CC8F` — tombol call to action "Setor Sekarang" dan indikator countdown.
  - **Misty Slate (Background):** `#F7F9F6` — kanvas hangat non-glare, bukan putih steril `#FFFFFF`.
  - **Granite (Typography):** `#1A201A` — keterbacaan tinggi di layar HP di bawah sinar matahari.
- **Anti-Slop Directives:**
  - **NO** hero banner ilustrasi kartun generik orang melayang dengan koin raksasa.
  - **NO** card berjejer dengan border abu-abu tipis tanpa hirarki tegas.
  - **NO** gradient ungu-pink klise web Web3/AI.
  - **YES** fotografi asli glamping (tenda safari, api unggun malam, grilling pan) beresolusi tajam dengan rasio aspek konsisten (16:9 atau 4:3).
  - **YES** angka monospaced (`font-mono` / tabular-nums) untuk seluruh nilai nominal IDR agar digit tidak bergeser saat data refresh.

### 8.2 Responsive Mobile-First Screen Breakdown

#### Screen 1: Dashboard Utama (Mobile Viewport 390px - 430px)
1. **Sticky Header:** Nama trip ("Glamping Ciwidey"), badge sisa hari ("⏳ 14 Hari Lagi"), avatar koordinator, dan tombol share invite link.
2. **Hero Target Card:**
   - Background deep pine green dengan pattern kontur topografi halus.
   - Angka terkumpul besar: `Rp 3.920.000` dari total `Rp 5.600.000` (70%).
   - Progress bar tebal (12px) dengan animasi transisi smooth.
   - Status: "Tersisa Rp 1.680.000 untuk lunas total".
3. **Primary Action Bar:** 2 tombol cepat:
   - Button utama (Campfire Amber): "⚡ Setor Patungan".
   - Button sekunder (Outline Green): "📝 Catat Pengeluaran".
4. **Member Contribution Strip (7 Avatar Carousel / Grid 2-kolom di mobile):**
   - Menampilkan 7 slot nama teman dengan foto/inisial.
   - Badge status:
     - 🟢 Lunas ("Siap Berangkat")
     - 🟡 Cicilan (Rp 400.000 / Rp 800.000)
     - 🟠 Menunggu Cek
     - ⚪ Belum Bayar
5. **Recent Activity Feed:** Feed kronologis singkat ("Sarah menyetujui setoran Dimas Rp 400.000 • 2j yang lalu").

#### Screen 2: Detail Pos Alokasi Biaya (Tab Rincian)
1. **Interactive Breakdown Cards:**
   - Pos Tenda (Rp 2.800.000 — 50%)
   - Pos BBQ & F&B (Rp 1.400.000 — 25%)
   - Pos Bensin & Tol (Rp 1.050.000 — 18.75%)
   - Dana Darurat (Rp 350.000 — 6.25%)
2. Tiap card dapat di-expand untuk melihat detail: vendor tenda, estimasi kg daging BBQ, dan status pemesanan.

#### Screen 3: Halaman Setor Dana & QRIS Vault (Tab Setor)
1. **Static QRIS Display Card:**
   - Gambar QRIS statis milik koordinator dengan fitur "Simpan Gambar" atau "Buka di Aplikasi Bank".
   - Rekening alternatif: BCA / Mandiri / GoPay milik bendahara lengkap dengan tombol 1-klik "Salin Nomor Rekening".
2. **Form Konfirmasi Transfer:**
   - Input nominal setor (preset: Rp 200.000, Rp 400.000, Rp 800.000 / Lunas).
   - Area drag & drop / capture kamera HP untuk screenshot bukti transfer.
   - Input keterangan singkat.
   - Tombol "Kirim Bukti Pembayaran".

#### Screen 4: Koordinator Review Drawer (Hanya Muncul untuk Koordinator)
1. Badge counter angka merah jika ada bukti pembayaran pending.
2. Modal preview gambar resi transfer fullscreen.
3. Tombol aksi cepat: "✅ Terima (Approve)" dan "❌ Tolak (Reject dengan Alasan)".

#### Screen 5: On-site Expense Logger & Splitter (Tab Pengeluaran)
1. **Total Pengeluaran Lapangan Terkumpul:** e.g., `Rp 420.000 terpakai dari kas darurat`.
2. **FAB (Floating Action Button):** "+ Catat Nota".
3. **List Nota Riil:**
   - "Briket & Arang Kelapa" — Rp 45.000 (Ditalangi Dimas)
   - "Air Mineral Galon & Es Batu" — Rp 35.000 (Kas Bersama)
4. **Kalkulator Penyelesaian Akhir (Settlement Summary):** Menampilkan siapa yang harus transfer ke siapa jika ada sisa/kurang bayar.

---

## 9. Non-Functional Requirements (NFR)

| Kategori | Spesifikasi & Batasan |
|---|---|
| **Mobile Responsiveness** | Target viewport utama 360px - 430px (iOS Safari & Android Chrome). Sentuhan jempol (thumb zone) ramah satu tangan; min tap target $44 \times 44\text{ px}$. |
| **Media & Storage (Vercel Blob)** | Maksimum ukuran file gambar 5MB. Format yang diterima: `image/jpeg`, `image/png`, `image/webp`. Gambar otomatis diberi hash unik di CDN. |
| **Numeric & Decimal Integrity** | Seluruh operasi aritmatika uang dilakukan dengan `BigInt` / integer murni tanpa desimal. Format representasi ke UI menggunakan `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`. |
| **Performance & Latency** | First Contentful Paint (FCP) $< 1.2\text{s}$ pada koneksi 4G mobile. Dashboard data di-cache via React Query `staleTime: 15_000` (15 detik). |
| **Invite & Auth Security** | Token URL dibuat dengan kombinasi `crypto.randomUUID()` 128-bit entropy. Role koordinator diisolasi ketat di API route server-side. |
| **Zero-Config Cold Start** | Neon.tech Serverless Postgres menggunakan pooled connection string untuk mencegah *exhaustion* pada Vercel Serverless Functions. |

---

## 10. Email Notification System (V1 Scope)

Notifikasi V1 menggunakan transactional email via **Resend** (ringkas, tanpa spamming).

### Trigger Events & Template Matrix:
| Trigger Event | Penerima | Subjek Email | Konten Inti |
|---|---|---|---|
| **Bukti Transfer Baru Diupload** | Koordinator | `[otwglamping] Ada setoran baru dari {member_name}!` | Menampilkan nama member, nominal Rp, tombol link langsung untuk Review Bukti. |
| **Setoran Disetujui (Approved)** | Member terkait | `[otwglamping] Hore! Setoranmu Rp {amount} sudah diverifikasi` | Menampilkan sisa kekurangan patungan member dan progress bar grup terbaru. |
| **Setoran Ditolak (Rejected)** | Member terkait | `[otwglamping] Mohon cek kembali setoranmu` | Menampilkan alasan penolakan dari koordinator dan link upload ulang. |

---

## 11. Scope Matrix: MVP V1 vs Post-MVP (V2 Roadmap)

| Fitur / Kemampuan | MVP V1 (In-Scope) | Fase 2 (Roadmap V2) |
|---|---|---|
| **Verifikasi Pembayaran** | Manual verification oleh koordinator | Otomasi webhook Dynamic QRIS / Payment Gateway (Midtrans / Xendit) |
| **Metode Pembayaran** | Static QRIS Image display + transfer manual | Virtual Account otomatis per peserta |
| **Autentikasi** | Magic Link via URL token (No login) | Optional Google One-Tap Login untuk menyimpan arsip multi-trip |
| **Notifikasi** | Transactional Email via Resend | Notifikasi otomatis WhatsApp Blast via API (Fonnte/Waha) |
| **Kapasitas Grup** | 1 trip aktif per link (skala 5–10 orang, basis 7) | Multi-trip dashboard & manajemen sewa perlengkapan |
| **Dokumentasi Trip** | Upload struk & nota pembayaran | Photo gallery & collaborative itinerary planner |
| **Ekspor Data** | Copy summary teks ke WhatsApp clipboard | Export rekapan pengeluaran ke Excel / PDF resmi |

---

## 12. Verification & Acceptance Checklist

Sebelum dinyatakan *Ready for Production Deployment*, tim engineering wajib memvalidasi skenario berikut:
- [ ] Inisiasi grup baru menghasilkan URL koordinator dan URL member yang dapat diakses di tab incognito terpisah.
- [ ] Upload gambar struk 4.5MB terkompresi lancar dan tersimpan di Vercel Blob.
- [ ] Penjumlahan seluruh pos biaya tepat sama dengan `target_amount`.
- [ ] Ketika koordinator klik "Approve", dashboard member yang sedang terbuka langsung mengupdate saldo (tanpa full-page reload).
- [ ] Tampilan antarmuka tidak rusak pada resolusi iPhone SE (375px) maupun Android layar sempit (360px).
- [ ] Tampilan visual bersih dari gaya AI generik: tipografi outdoor tajam, foto tematik nyata, tidak ada ilustrasi 3D mengambang.
