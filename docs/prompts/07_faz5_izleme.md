# Faz 5 – Sunucu izleme, loglar ve etkinlikler

Ön koşul: Faz 3. `docs/prompts/00_README.md` oku.

Yapılacaklar:
1. **Metrikler**: köprü `status` + sistem ölçümü (CPU/RAM/disk/ağ; Linux'ta `/proc`, FreeBSD'de `sysctl`; ayrı küçük "agent" modülü, panelden bağımsız çalışabilir). Zaman serisini `panel.db`'de tut (`metrics` tablosu, 1 dk çözünürlük, 30 gün saklama + otomatik temizlik). WebSocket veya SSE ile canlı akış (`/api/stream`), yetkili.
2. **Dashboard**: gerçek online grafiği (24 sa/7 gün seçilebilir), kanal/core durum kartları (up/down, uptime, ping), son GM işlemleri akışı, uyarılar (kanal düştü, CPU>90%, disk>90%) ve eşikler ayarlanabilir; isteğe bağlı webhook (Discord) bildirimi.
3. **Loglar**: oyun `log` veritabanından (item log, giriş/çıkış, GM komut logu, chat log varsa) filtrelenebilir arama sayfaları: oyuncu/zaman/tür filtresi, sayfalama, CSV dışa aktarma. Tablo adları Faz 0 sonucuna göre. Ağır sorgular için zaman aralığı zorunlu ve `LIMIT` üst sınırı.
4. **Etkinlikler**: EXP/drop çarpanı etkinliği (başlangıç/bitiş, çarpan) — core'da mevcut mekanizma (priv/`/priv_empire` benzeri) varsa köprü komutu olarak ekle (`set_priv`), zamanlayıcı panelde (`node-cron` benzeri, kalıcı), etkinlik bitince otomatik geri al. Duyuru zamanlayıcı (tekrarlı notice).
5. **Denetim sayfası** iyileştirmeleri: filtre (yönetici/işlem/hedef/tarih), `önce → sonra` görünümü, dışa aktarma; audit kayıtları panelden silinemez/değiştirilemez (yalnız ekleme).
6. Testler: metrik saklama/temizleme, eşik uyarı mantığı, log sorgularında SQL enjeksiyonu denemesi.

Bitti sayılır: dashboard canlı veriyle akıyor, bir kanalı durdurunca uyarı çıkıyor, log sayfaları filtreli çalışıyor, EXP etkinliği zamanlanıp otomatik başlıyor/bitiyor.
