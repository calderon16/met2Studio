# Faz 3 – Core köprüsü ve anlık (canlı) işlemler

Ön koşul: `docs/FAZ0_SONUC.md`, core C++ kaynağı elimizde. `docs/prompts/00_README.md` oku. Amaç: panelden level/EXP/yang/kick/duyuru/drop-reload işlemlerinin **restart olmadan** oyuna yansıması. Online oyuncunun DB satırı yazılmaz; bunun yerine core içinde küçük bir yönetim modülü çalışır.

Tasarım (değiştirmeden önce Faz 0 bulgularıyla uyumunu doğrula, gerekirse gerekçeyle revize et):
- Core'a (game süreci, her kanal/CH için) **yerel dinleyen** bir yönetim soketi ekle: `127.0.0.1` veya Unix socket, ayrı port (`CONFIG` içinde `ADMIN_BRIDGE_PORT`, `ADMIN_BRIDGE_SECRET`). Protokol: satır tabanlı JSON, her istek `{id, ts, cmd, args, sig}`; `sig = HMAC-SHA256(secret, id|ts|cmd|canonical(args))`, ±30 sn zaman penceresi, kullanılmış `id` reddi (replay), tek bağlantıda hız sınırı.
- Komutlar (beyaz liste): `ping`, `status` (online sayısı, kanal bilgisi, uptime), `find_player`, `set_level`, `add_exp`, `add_gold`, `give_item` (online oyuncu için `AutoGiveItem`), `kick`, `notice`, `reload_drop`, `reload_proto` (varsa mevcut reload fonksiyonlarını çağır). Her komut mevcut GM komut mantığını/fonksiyonlarını yeniden kullansın; yeni oyun mantığı yazma.
- Çoklu kanal: panel her kanala bağlanır; oyuncu hangi kanaldaysa o kanala yönlendirilir (`find_player` tüm kanallara sorar). Offline oyuncu için `set_level` vb. reddedilir veya DB yoluyla yalnızca güvenli alanlar (karar Faz 0'a göre) yapılır.
- Güvenlik: sır env/CONFIG'te, loglanmaz; modül varsayılan **kapalı** (`ADMIN_BRIDGE_ENABLED=0`); yalnız localhost/özel ağ; her komut core logunda `[BRIDGE]` etiketiyle.

Yapılacaklar:
1. Core tarafı: yönetim modülünü ayrı dosyalara ekle (`game/src/admin_bridge.{h,cpp}`), mevcut kodu minimum değiştir (derleme sistemine ekleme + init/shutdown hook'ları). Patch'i `core-patches/` altında `git format-patch` veya `.patch` olarak repoya koy, nasıl uygulanacağını `docs/CORE_BRIDGE.md`'de anlat.
2. Panel tarafı: `server/src/adapter/corebridge.ts` — protokol istemcisi (imzalama, zaman aşımı, yeniden bağlanma, kanal yönlendirme). `CoreBridgeAdapter implements GameAdapter`: okuma/DB işlemlerini `MysqlAdapter`'a, canlı işlemleri köprüye delege eder. Bağlantı ekranına köprü ayarları (host/port/secret) ekle; `status()` artık gerçek online/kanal verisi döndürür.
3. Hata modeli: köprü kapalıysa canlı işlemler net mesajla reddedilir (DB'ye düşme yok). İşlem sonucu `{applied, message}` ve audit'e yazılır.
4. Drop reload: `reload_drop` core'da dosyaları yeniden okuyup bellek tablosunu **atomik** değiştirsin (yarım yüklenmiş tabloyla çalışma yok); hata olursa eski tablo kalsın.
5. Testler: köprü protokolü için çekirdeksiz sahte sunucu (Node) ile istemci testleri (imza, replay, zaman aşımı); core tarafını test sunucusunda manuel doğrulama adımlarıyla `docs/CORE_BRIDGE.md`'ye yaz.

Bitti sayılır: test sunucusunda panelden level/EXP/yang değişikliği oyuncunun ekranında anında görünüyor, kick/duyuru çalışıyor, drop reload sonrası yeni drop oyunda geçerli, yanlış imza/replay reddediliyor, modül kapalıyken hiçbir port dinlenmiyor.
