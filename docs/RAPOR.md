# Metin2Studio – Araştırma ve Mimari Raporu

> Durum: ONAY BEKLİYOR. Henüz kod yazılmadı.
> Not: Arama motoru Metin2'ye özel teknik dokümanda zayıf kaldı; `metin2.dev`, `elitepvpers` ve `old-metin2.com` sayfalarına bu ortamdan erişilemedi (ağ kısıtı). Aşağıdaki bilgilerin bir kısmı arama sonuçlarından, bir kısmı bilinen Metin2 sunucu mimarisinden gelir. "Doğrulanmalı" etiketli maddeler sizin sunucu dosyanıza (core) bakılarak kesinleştirilmelidir.

## 1. Hedef
Web tabanlı GM paneli:
1. NPC / Boss / Mob drop ekleme-kaldırma-düzenleme
2. Oyuncuya item, yang, level, exp verme / ayarlama
3. Sunucu bilgileri (online sayısı, kanal/core durumu, CPU/RAM, log)
4. Hepsi **anlık** (restart gerektirmeden) oyuna yansısın

## 2. Metin2 sunucu mimarisi (özet)
- Süreçler: `db` (MySQL önbellek katmanı), `game` çekirdekleri (kanal/CH başına, ayrıca `auth`), `login`.
- MySQL veritabanları: `account`, `player`, `common`, `log`.
- `player` DB: `player`, `item`, `item_proto`, `mob_proto`, `item_award` vb.
- Drop verisi **metin dosyalarında** (game core açılışta okur): `mob_drop_item.txt`, `drop_item_group.txt`, `common_drop_item.txt`, `special_item_group.txt`, `mob_proto` (txt/DB).
- Çevrimiçi oyuncunun verisi game/db core **belleğinde** tutulur; DB'ye periyodik yazılır.

## 3. Kritik bulgu: "Anlık" nasıl yapılır
Online oyuncunun DB satırını doğrudan UPDATE etmek **işe yaramaz ve tehlikelidir**: core bellekteki değeri sonra DB'nin üstüne yazar (item/level geri gider, dupe riski). Seçenekler:

| Yöntem | Anlık? | Core kaynak kodu gerekir? | Risk | Not |
|---|---|---|---|---|
| A. Doğrudan MySQL UPDATE | Sadece offline oyuncu | Hayır | Yüksek | Online oyuncuda eziliyor |
| B. `item_award` tablosuna INSERT | Evet (core tabloyu tarar) | Hayır* | Düşük | Item/yang gönderimi için en güvenlisi. *Çoğu core'da var, doğrulanmalı |
| C. Core'a küçük yönetim endpoint'i (TCP/HTTP, imzalı) ekleme | Evet | **Evet** | Orta (yetki iyi yapılmalı) | Level/exp/yang/kick/notice/reload için en doğru yol |
| D. GM karakter botu (oyun protokolüyle girip `/komut` yazar) | Evet | Hayır | Orta, kırılgan | Core'a dokunamıyorsak yedek plan |
| E. Dosya düzenle + `reload` | Kısmen | Hayır/Evet | Orta | Drop dosyaları için; aşağıya bakın |

### Önerim (hibrit)
- **Item verme** → B (`item_award`), yoksa C.
- **Level / EXP / Yang / Kick / Duyuru / Ban** → C (core'a küçük yönetim modülü). GM komutları zaten var (`/advance`, `/set`, `/item`, `/reload`...); endpoint bunları çağıran ince bir köprü olur.
- **Drop** → panel DB'de düzenler → panel dosyaları üretir/yazar → core'a `reload` tetiklenir.
- **Sunucu bilgisi** → MySQL (online hesap/oyuncu), süreç/sistem ölçümü (agent), log tabloları.

## 4. GM komutları (kaynaktan doğrulanan)
Old Metin2 Project `cmd.cpp` komut tablosu: `item` → GM_GOD, `set` → GM_IMPLEMENTOR, `advance` → GM_GOD. `do_advance` hedefi `FindPC` ile bulup `ResetPoint` ile seviyeyi ayarlar (EXP'yi sıfırlamak için düzeltme önerisi Metin2Dev'de var). Kullanılabilir komutlar: `/item`, `/set`, `/advance`, `/reload q|p|a ...`, `/full_set`, `/notice`, `/dc`/kick. **Panel rolleri bu GM seviyelerine eşlenmeli.** Core sürümünüze göre komut adları değişebilir — doğrulanmalı.

## 5. Drop sistemi
- `mob_drop_item.txt`: `Group` bloğu; `Mob <vnum>`, `Type` (`drop` yaygın, `kill`, `limit`), `kill_drop` (kaç öldürmede), `level_limit` (oyuncu seviye farkı, ör. 15), satırlar: `index  item_vnum  count  rate(‰×100)`. Alan adları çekirdeğe göre farklı olabilir.
- Boss/NPC için özel grup, ortak dropler için `common_drop_item.txt`.
- **Canlı reload**: standart core'larda drop dosyaları için hazır reload yok (genelde `reload p`=proto, `reload q`=quest). Çözüm: core'a `reload drop` komutu eklemek (C bölümü ile aynı modül) — küçük bir C++ değişikliği. Alternatif: kanal kanal restart (anlık değil).
- Panel, dosyayı **elle parse etmek yerine** drop verisini kendi DB tablolarında tutup dosyaya derler (yedek + geri alma + diff).

## 6. Önerilen teknoloji yığını
- Backend: Node.js + TypeScript (NestJS veya Fastify), MySQL/MariaDB (mysql2/Prisma), WebSocket (canlı durum).
- Frontend: React + Vite/Next.js, Tailwind, shadcn/ui, TanStack Table, ECharts.
- Core köprüsü: C++ küçük modül (imzalı TCP/Unix socket) **veya** `item_award` + GM bot.
- Dağıtım: oyun sunucusuyla aynı makine/özel ağ; panel internete **HTTPS + VPN/IP kısıtı** ile.

## 7. Güvenlik (zorunlu)
- Rol bazlı yetki (Owner / Admin / GM / Moderatör), 2FA, oturum süresi, IP beyaz liste.
- Her işlem **audit log** (kim, kime, ne, ne zaman, önce/sonra değeri).
- Panel MySQL kullanıcısı en az yetkiyle; root asla.
- Core endpoint'i sadece localhost/özel ağ + HMAC imza + replay koruması.
- Toplu/yıkıcı işlemlerde onay + limit (örn. tek seferde max item sayısı), geri alma.
- Parametreli sorgu (SQL injection), CSRF/XSS koruması.

## 8. Modüller
1. **Giriş & Yetki** (roller, 2FA, audit)
2. **Dashboard** (online, kanal durumu, CPU/RAM, son işlemler)
3. **Oyuncu Yönetimi** (ara, detay, envanter, item/yang/level/exp, ban/kick/mute, teleport)
4. **Drop Yönetimi** (mob/boss/NPC seçici, item arama, oran, ekle/sil, toplu işlem, canlı uygula)
5. **Item/Mob veritabanı tarayıcısı** (proto okuma, ikon/isim)
6. **Duyuru & Olaylar** (notice, EXP/drop event çarpanı)
7. **Loglar** (GM log, item log, giriş log)
8. **Ayarlar**

## 9. Aşamalı plan
- **Faz 0 – Keşif (1-2 gün):** Sunucu dosyası/core sürümünü, DB şemasını, `item_award` varlığını, GM komut tablosunu doğrulama. *Bunun için bana core adı/kaynağı ve DB şeması lazım.*
- **Faz 1 – İskelet:** Auth/RBAC, audit, dashboard, oyuncu arama (salt okunur).
- **Faz 2 – Oyuncu işlemleri:** item (item_award), level/exp/yang (core köprüsü).
- **Faz 3 – Drop editörü + canlı reload.**
- **Faz 4 – Sunucu izleme, loglar, event.**
- **Faz 5 – Sertleştirme, test, dağıtım.**

## 10. Onayınızdan önce cevaplanması gereken sorular
1. Hangi sunucu dosyası/core? (ör. Old Metin2 Project, kendi derlediğiniz C++ kaynak?) **Core kaynak koduna erişiminiz var mı?** (anlık level/exp için en büyük belirleyici)
2. Panel ile oyun sunucusu aynı makinede mi?
3. MySQL/MariaDB sürümü, şema sizde hazır mı?
4. Dil: panel arayüzü Türkçe mi, çok dilli mi?
5. Kullanıcı sayısı/rol ihtiyacı (kaç GM)?
6. Stack tercihiniz var mı (Node/React önerim; PHP/Laravel de olur)?

## Kaynaklar
- Old Metin2 Project `cmd.cpp` (komut tablosu): https://git.old-metin2.com/WildEgo/server/src/commit/972530f3a74a4297263f23783a13dde7a8e176a2/game/src/cmd.cpp
- GM Commands (Metin2Dev): https://metin2.dev/topic/21-gm-commands/
- Fix commands change Level: https://metin2.dev/topic/32962-fix-commands-change-level/
- mob_drop_item.txt yapısı: https://metin2.dev/topic/17673-mob_drop_itemtxt-structure-kill_drop-level_limit/
- Mob drop nasıl çalışır: https://metin2.dev/topic/32557-how-does-mob-drop-item-actually-work/
- Yeni drop tipi (level_min/max): https://metin2.dev/topic/34279-new-mob-drop-type/
- Server control panel (elitepvpers): https://www.elitepvpers.com/forum/metin2-private-server/2399909-metin2-server-control-panel.html
- open-mt2 (Node.js Metin2): https://github.com/willianmarquess/open-mt2
