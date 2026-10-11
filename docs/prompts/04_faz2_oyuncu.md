# Faz 2 – Gerçek şema ile oyuncu işlemleri

Ön koşul: `docs/FAZ0_SONUC.md` var. `docs/prompts/00_README.md` oku. Hedef: `MysqlAdapter`'ı gerçek şemaya oturtup oyuncu yönetimini üretime hazır yapmak. Level/exp/yang/kick **canlı** işlemleri Faz 3'e kalır; bu fazda DB tarafı ve güvenli olanlar.

Yapılacaklar:
1. `server/src/adapter/mysql.ts`'i Faz 0 sonucundaki gerçek tablo/kolon adlarına göre düzelt. Şema farklarını tek yerde (`schema.ts` eşleme nesnesi) topla; SQL'de başka yerde sabit kolon adı kalmasın. Başlangıçta `probe()` ile gerekli tabloları doğrula, eksikse bağlanmayı reddet ve net hata ver.
2. Oyuncu arama: ad, hesap (`login`), id; sıralama/sayfalama (cursor veya offset+limit+toplam), indeks kullanımını `EXPLAIN` ile kontrol et. Çevrimiçi durumu: Faz 0'da bulunan yöntemle; güvenilir yol yoksa "bilinmiyor" göster, tahmin etme.
3. Oyuncu detayı: tam envanter (`INVENTORY`, ayrıca `EQUIPMENT`, depo `SAFEBOX`/`MALL` salt-okunur), item adları `item_proto`'dan; yang, EXP, sınıf, kimlik, son giriş, hesap durumu.
4. Item teslimi: Faz 0 kararına göre `item_award` (kolonlar, `mall` bayrağı, `why` alanı) doğrula; vnum'u `item_proto`'da doğrula; adet üst sınırı (stackable değilse 1); aynı isteği iki kez göndermeyi önlemek için idempotency anahtarı (`X-Request-Id`) ve audit'te `award_id`. Teslim durumu (alındı mı) görüntülenebilsin.
5. Hesap işlemleri (offline güvenli olanlar): ban/unban (`account.status` veya core'a uygun alan), mute süresi (varsa alan), hesap bilgisi salt-okunur. Her işlemde sebep zorunlu, audit'e `önce → sonra`.
6. Item veritabanı sayfası: `item_proto` listesi, ad/vnum arama, tür/seviye filtresi, sayfalama.
7. Test: gerçek test DB'sine karşı entegrasyon testleri (docker `mariadb` ile; şemayı `scripts/test-schema.sql` olarak ekle). Adapter sözleşme testleri `MockAdapter` ve `MysqlAdapter` için ortak çalışsın.

Bitti sayılır: gerçek sunucu DB'sine bağlanıp oyuncu ara/detay/item gönder/ban akışlarını denedim; oyunda item mall'a düştü (ben doğrulayacağım); testler geçer; kodda sabit kolon adı dağınık değil.
