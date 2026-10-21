Bertindaklah sebagai Senior Product Manager. Buatkan Product Requirements Document (PRD) yang komprehensif, terstruktur, dan siap dieksekusi oleh tim engineering untuk aplikasi web bernama "otwglamping" (Shared Expense &amp; Group Saving Tracker) yang dirancang khusus untuk perencanaan glamping kelompok teman (skala 5–10 orang, basis use-case 7 orang).

Susun dokumen dengan format PRD standar industri:

1. Product Overview &amp; Context

- Nama Produk: otwglamping
- Value Proposition: Menghilangkan kecanggungan menagih uang patungan dan mempermudah tracking tabungan glamping bersama teman secara transparan.
- Success Metrics: Completion rate target tabungan kelompok, ketepatan waktu verifikasi setoran, dan user engagement pada activity feed.

2. User Persona &amp; Roles

- Coordinator / Trip Lead (Bendahara): Mengatur target total, approve bukti setoran, mencatat pengeluaran riil di lokasi glamping.
- Member (Peserta Glamping): Menyetor dana, upload bukti transfer, memantau sisa target tabungan dan rincian alokasi biaya.

3. Detailed User Journey

- Flow dari inisiasi grup "otwglamping" -&gt; undang 6 teman via invite link/QR -&gt; breakdown pos biaya (tenda glamping, BBQ/makan, transportasi) -&gt; siklus nabung mingguan/bulanan -&gt; split bill pengeluaran tak terduga saat hari H.

4. Core Functional Requirements &amp; Acceptance Criteria

Tuliskan spesifikasi fitur utama dalam format User Story + Acceptance Criteria (Given/When/Then):

- Group Goal &amp; Budget Allocation (Set target total, deadline trip, rincian pos biaya).
- Shared Pool Dashboard (Visual progress bar, persentase terkumpul, countdown hari menuju trip glamping).
- Member Contribution Grid (Avatar 7 member, status lunas/cicilan, badge "Siap Berangkat" vs "Belum Setor").
- Proof of Payment Vault (Upload struk/transfer, approval flow oleh koordinator).
- On-site Expense Logger (Pencatatan nota pengeluaran dadakan saat glamping dan kalkulasi split bill).

5. UI/UX Wireframe &amp; Design System Direction

- Screen Breakdown: karena ini tujuannya untuk mobile web, pastikan bagus untuk rwd, dan juga bakal ada banyak gambar gambarnya atau foto.

- Screen Breakdown: Dashboard Utama, Detail Rincian Biaya, Halaman Setor &amp; Bukti, Tab Catatan Pengeluaran.
- Visual Mood: Kasual, fresh, outdoor/adventure vibes yang memicu antusiasme liburan.

6. Non-Functional Requirements (NFR)

- Mobile-first web responsiveness.
- Keamanan upload file (format &amp; batas ukuran gambar bukti transfer), nanti pakai qris.
- Integritas data kalkulasi saldo dan desimal mata uang (IDR).

7. MVP Scope (V1 vs Out-of-Scope)

- Jelaskan batasan jelas fitur yang wajib ada di V1 (manual verification) vs fitur fase berikutnya (automasi payment gateway, notifikasi WhatsApp blast otomatis).

Gunakan bahasa Indonesia yang profesional, ringkas, dan jelas dengan tabel serta poin-poin terstruktur.