# Faz 0 – Sunucu kurulumu sonrası keşif ve doğrulama

Bağlam: Metin2Studio reposundayız (`docs/prompts/00_README.md` ve `docs/RAPOR.md` oku). Artık gerçek bir Metin2 sunucusu kurulu. Hedef: mimariyi tahmin değil gerçeğe göre kesinleştirmek. **Bu fazda hiçbir yazma işlemi yapma**, sadece oku ve raporla.

Sunucu bilgileri (ben dolduracağım): core adı/sürümü: ___ · işletim sistemi: ___ · kaynak kod yolu: ___ · MySQL erişimi: ___ (salt-okunur kullanıcı oluşturduysam belirteceğim).

Yapılacaklar:
1. `scripts/phase0/probe_server.sh` ve `scripts/phase0/probe.sql` dosyalarını çalıştır, çıktıları `docs/faz0_cikti/` altına kaydet (şifreler maskeli, çıktıları commit'leme: `.gitignore`'a ekle).
2. Kaynak koda bak: `game/src/cmd.cpp` komut tablosu (hangi GM komutları, hangi GM seviyesi), `cmd_gm.cpp` (`do_item`, `do_set`, `do_advance`), `ItemAwardManager` (var mı, hangi kolonlar, kaç saniyede bir tarıyor), drop yükleyicileri (`mob_drop_item.txt`, `drop_item_group.txt`, `common_drop_item.txt`, `special_item_group.txt` hangi sınıfta, hangi komutla yeniden yüklenebiliyor), `CHARACTER::PointChange`, `AutoGiveItem`, notice/kick fonksiyonları.
3. Gerçek DB şemasını `MysqlAdapter` içindeki varsayımlarla karşılaştır: `player.player` (kolon adları), `account.account`, `player.item` (`window`, `pos`), `player.item_award`, `item_proto`, `mob_proto`, `common.gmlist`. Farkları tablo halinde yaz.
4. Online oyuncu tespitinin DB'den güvenilir bir yolu var mı araştır (ör. `last_play`, ayrı bir tablo, core'un yazdığı bir şey). Yoksa not düş.
5. Drop dosyalarının gerçek formatını örnek satırlarla belgele (Group/Mob/Type/kill_drop/level_limit alan adları bu core'da ne).
6. Çıktı: `docs/FAZ0_SONUC.md` — (a) doğrulanan şema, (b) item teslim yöntemi kararı (item_award / core köprüsü), (c) canlı işlemler için karar (köprü gerekli mi, hangi fonksiyonlar), (d) drop reload için karar, (e) Faz 2-4 için güncellenmiş görev listesi ve riskler.

Bitti sayılır: `docs/FAZ0_SONUC.md` var, her "doğrulanmalı" madde ya doğrulandı ya da gerekçesiyle açık bırakıldı. Kod değişikliği yok.
