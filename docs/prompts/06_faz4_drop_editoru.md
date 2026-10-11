# Faz 4 – Gerçek drop editörü

Ön koşul: Faz 0 (dosya formatları) ve Faz 3 (`reload_drop`). `docs/prompts/00_README.md` oku. Şu an drop ekranı `MockAdapter` üzerinde çalışıyor; gerçek dosyalara bağla.

Yapılacaklar:
1. **Parser/yazıcı**: `server/src/drops/` altında `mob_drop_item.txt`, `drop_item_group.txt`, `common_drop_item.txt`, `special_item_group.txt` için ayrıştırıcı + serileştirici (Faz 0'da belgelenen gerçek format). Yorum satırlarını ve bilinmeyen blokları **kaybetmeden** koru (round-trip testi: oku → yaz → dosya birebir aynı veya yalnız bilinçli farklar). Birim testleri gerçek örnek dosyalarla.
2. **Kaynak gerçeği**: Panel DB'sinde (`panel.db`) drop verisini tablolara al (`drop_groups`, `drop_entries`, `revisions`); dosyalar bu tablolardan **derlenir**. İlk içe aktarma komutu: mevcut dosyalardan DB'ye import.
3. **Uygulama akışı** ("Canlı Uygula"): doğrula (vnum'lar `item_proto`/`mob_proto`'da var mı, oran aralığı, çakışma/yinelenen satır) → yedek al (`backups/drops/<tarih>/`) → dosyaları geçici adla yaz → atomik `rename` → `reload_drop` köprü komutu → başarısızsa **otomatik geri al** ve hatayı göster. Sürüm numarası/`revision` kaydı (kim, ne zaman, diff).
4. Arayüz: değişiklik **diff** önizlemesi (satır bazlı, ekleme/silme/değişiklik renkli), revizyon geçmişi ve tek tıkla geri dönme, toplu işlem (seçili mob'lara aynı item ekle, oranı çarpanla değiştir), "toplam drop beklenen değeri" göstergesi ve aşırı oran uyarısı, ortak drop (common) ve boss/metin gruplarını düzenleme, mob/NPC listesi `mob_proto`'dan (tür, seviye, rank), item seçici (arama + ikon).
5. İkonlar: item ikonlarını client dosyalarından çıkarma (`.dds/.tga` → png) için ayrı, isteğe bağlı bir betik (`scripts/extract-icons`), panel `/assets/icons/<vnum>.png` varsa gösterir, yoksa yer tutucu. Telif/dağıtım konusunu README'ye not et (ikonlar repoya commit edilmez).
6. Eşzamanlı düzenleme: iki GM aynı mobu düzenlerse `revision` çakışması (If-Match / 409) ile uyar.

Bitti sayılır: gerçek dosyalarla round-trip testi geçer; panelden eklediğim bir drop oyunda restart olmadan düşüyor; kasıtlı bozuk girişte otomatik geri alma çalışıyor; revizyon geçmişinden eski sürüme dönebiliyorum.
