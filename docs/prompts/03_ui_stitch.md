# Arayüz tasarımı – Stitch ile üret, React'a uygula

Bağlam: `docs/prompts/00_README.md` ve `docs/STITCH_PROMPT.md` oku. Stitch MCP bağlı olmalı (`claude mcp list` → stitch Connected; araçlar `mcp__stitch__*`). Mevcut web arayüzü işlevsel ama sade; hedef tasarım dili `docs/STITCH_PROMPT.md`'deki gibi koyu "oyun operasyon merkezi" teması.

Yapılacaklar:
1. `mcp__stitch__create_project` ile "Metin2Studio" projesi aç. Önce `docs/STITCH_PROMPT.md` içindeki prompt ile **Dashboard, Oyuncular (detay çekmecesiyle), Drop Yönetimi** ekranlarını `generate_screen_from_text` ile üret. Tasarım sistemi oluştur (`create_design_system`): renkler `#0B0E14/#131826/#232A3B`, altın `#E3B04B`, kırmızı `#C8434B`, yeşil `#3FBF8F`, mavi `#4C8DFF`; Inter + Cinzel + JetBrains Mono. Sonra kalan ekranları (Giriş, Bağlantı [Navicat tarzı form], Item Veritabanı, Duyurular & Etkinlikler, Loglar, Yetki & Roller) aynı sistemle üret. Gerekirse `edit_screens` / `generate_variants` ile iyileştir.
2. Ekranları `get_screen` ile al; HTML/CSS çıktısını **referans** olarak kullan, doğrudan yapıştırma. `web/` içindeki mevcut sayfaları bu tasarıma göre yeniden düzenle: tasarım token'larını `web/src/styles.css` `:root` içinde topla, ortak bileşenler çıkar (`Card`, `Table`, `Modal`, `Toast`, `ConfirmDialog` [yıkıcı işlemlerde yazarak onay], `Drawer`, `CommandPalette` Ctrl+K).
3. Eksik arayüz parçaları: oyuncu detay çekmecesi (sekmeler: Genel/Envanter/Loglar), item ikonları için yer tutucu (gerçek ikonlar Faz 4), boş durumlar, iskelet yükleme, toast bildirimleri, üst çubukta "Core bağlantısı: Canlı/Kapalı" göstergesi, tablet uyumu.
4. Erişilebilirlik: WCAG AA kontrast, klavye ile gezilebilir tablolar/modallar, `aria-label`'lar. (`design:accessibility-review` skill'i kullanılabilir.)
5. Yerel Türkçe metinler tutarlı olsun; metinleri tek yerde topla (`web/src/i18n.ts`) ki sonra çok dil eklenebilsin.

Kısıtlar: backend sözleşmesini (API yolları) bozma; yeni bağımlılık eklemeden önce gerekçe ver (Tailwind/shadcn istemiyorsam mevcut CSS ile devam). Ekran görüntüleri al (Playwright) ve `docs/ui/` altına koy.

Bitti sayılır: tüm ekranlar Stitch tasarımıyla görsel olarak uyumlu, typecheck/build geçer, 1360px ve 768px'te ekran görüntüleri tamam.
