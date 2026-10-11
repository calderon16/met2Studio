# Stitch Prompt – Metin2Studio GM Panel

Aşağıdaki metni olduğu gibi Stitch'e yapıştırın (Stitch İngilizce'de daha iyi sonuç verir; arayüz metinleri Türkçe belirtilmiştir).

---

Design a desktop-first web admin dashboard called **"Metin2Studio"**: a Game Master (GM) control panel for a Metin2 MMORPG private server. It is used daily by server admins to manage drops, give items/levels/EXP to players, and monitor the server live. Mood: dark, premium, "game-ops command center" with a subtle medieval/Eastern-fantasy accent, but clean and highly functional, like Linear / Grafana meets a fantasy game launcher. Not cartoonish.

**Visual style**
- Dark theme (background #0B0E14, surfaces #131826, borders #232A3B). Accent: warm gold #E3B04B (primary), crimson #C8434B (danger/ban), jade #3FBF8F (online/success), azure #4C8DFF (info).
- Typography: Inter for UI, a subtle serif display font (e.g. Cinzel) only for logo and page titles. Monospace (JetBrains Mono) for item vnums, IDs, logs.
- Rounded 10px cards, thin 1px borders, soft glow on active elements, dense but readable tables, 12-column grid, left sidebar navigation (collapsible), top bar with global search (player / item / mob), channel selector, and admin avatar with role badge.
- All UI text in **Turkish**.

**Screens to design (all in one consistent system)**
1. **Giriş (Login):** centered card, logo, username, password, 2FA code field, "Giriş Yap" button, IP-restriction notice.
2. **Dashboard – Genel Bakış:** KPI cards (Online Oyuncu, Toplam Hesap, Aktif Kanal, Yang Dolaşımı), live line chart of online players (24h), channel/core status list (CH1–CH4, Auth, DB, Login with green/red status dots, uptime, ping), CPU/RAM/disk gauges, "Son GM İşlemleri" activity feed, quick actions (Duyuru Gönder, Item Ver, Oyuncu Ara).
3. **Oyuncular:** searchable/filterable data table (Ad, Hesap, Seviye, Irk/Sınıf, Yang, Kanal, Durum online/offline, Son giriş). Row click opens a right-side detail drawer with tabs: Genel, Envanter (grid of item slots with icons and tooltips), Beceriler, Loglar. Action buttons: Item Ver, Level Ayarla, EXP Ekle, Yang Ekle, Işınla, Kick, Mute, Ban (danger, requires confirmation modal).
4. **Hızlı İşlem (modal):** "Oyuncuya Item Ver" – player picker, item search with icon preview, count, reason field, "Anında Uygula" toggle, confirmation summary, audit warning.
5. **Drop Yönetimi:** split layout. Left: tree/list of Mob / Boss / NPC with search, type tags (Mob, Boss, Metin Taşı, NPC) and level. Right: selected mob header (portrait, vnum, level, HP) and an editable drop table (Item ikon + ad, Vnum, Adet, Oran % with slider/inputs, Drop tipi: drop / kill / limit, Seviye sınırı). Buttons: "+ Item Ekle", delete row, bulk edit, "Değişiklikleri Karşılaştır (Diff)", "Canlı Uygula" (primary gold) and "Geri Al". Show a pending-changes banner and a drop-rate sanity indicator.
6. **Item Veritabanı:** grid/list browser of items with icon, name, vnum, type, level limit; filter chips; detail panel.
7. **Duyurular & Etkinlikler:** send server-wide notice (channel select, preview), schedule EXP/Drop rate event with multiplier sliders and start/end time.
8. **Loglar & Denetim:** filterable audit log table (zaman, yönetici, işlem, hedef, önce → sonra), export button, severity color tags.
9. **Yetki & Roller:** admin users list with role badges (Owner, Admin, GM, Moderatör) and permission matrix toggles.

**UX requirements**
- Clear success/error toasts like "Item oyuncuya anında gönderildi", destructive actions need confirm modals with typed confirmation.
- Empty states, loading skeletons, and a persistent connection indicator "Core bağlantısı: Canlı" in the top bar.
- Responsive: usable on tablet; sidebar collapses to icons.
- Accessible contrast (WCAG AA), keyboard-friendly tables and command palette (Ctrl+K).

Generate the Dashboard, Oyuncular (with detail drawer), and Drop Yönetimi screens first, then the rest in the same style.
