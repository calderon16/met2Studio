# Faz 1.5 – Kalıcı kullanıcılar, 2FA ve yönetim

Bağlam: `docs/prompts/00_README.md` oku. Faz 1 iskeleti hazır ama kullanıcılar bellekte (`server/src/auth.ts` `bootstrapUsers`), tek `admin`. Bunu üretime uygun hale getir.

Yapılacaklar:
1. Panelin kendi veritabanı: SQLite (`better-sqlite3`) `server/data/panel.db`. Oyun DB'sinden **ayrı**. Tablolar: `users(id, username unique, password_hash, role, totp_secret_enc, totp_enabled, disabled, created_at)`, `audit(id, time, actor, action, target, detail)`. Audit'i dosyadan bu tabloya taşı (`readAudit` aynı arayüzü korusun, sayfalama ekle). Migrasyon basit `CREATE TABLE IF NOT EXISTS` + `schema_version`.
2. İlk kurulum: kullanıcı yoksa `ADMIN_PASSWORD` ile `owner` oluştur; şifre env'de yoksa production'da hata ver (mevcut davranışı koru). Şifre politikası: min 12 karakter.
3. TOTP 2FA (`otplib`): kurulum akışı (QR için `otpauth://` URI, doğrulama kodu ile etkinleştirme), girişte ikinci adım. TOTP sırrı `connections.ts`'deki AES-GCM yardımcılarıyla şifreli saklansın (ortak `crypto.ts`'e çıkar). Kurtarma kodları (8 adet, hash'li).
4. Kullanıcı/rol yönetimi: `GET/POST/PATCH /api/users` (sadece `users.manage` izni; owner/admin), kullanıcı oluştur, rol değiştir, devre dışı bırak, şifre sıfırla. Owner kendini silemez/son owner düşürülemez. Yeni izin `users.manage` ekle (`ROLE_PERMS`).
5. Oturum: JWT süresi 8 sa kalsın; token'ı `httpOnly; Secure; SameSite=Strict` cookie'ye taşı (CSRF için `SameSite=Strict` + özel header kontrolü), `sessionStorage` kullanımını kaldır. Çıkışta cookie temizle.
6. IP beyaz listesi (env `ALLOWED_IPS`, CIDR destekli) ve giriş hız sınırı (kalıcı değil olabilir ama IP+kullanıcı bazlı). Proxy arkasında `trustProxy` ayarı env ile.
7. Web: Kullanıcılar sayfası, 2FA kurulum ekranı, giriş ekranında 2. adım. Mevcut stil/token sistemine uy.
8. Testler: auth akışı için en az login/2FA/yetki reddi testleri (`vitest`), `npm test` script'i.

Bitti sayılır: typecheck/build/test geçer; yeni kullanıcı oluşturup 2FA ile giriş yapabiliyorum; yetkisiz rol 403 alıyor; audit SQLite'ta; token JS'ten okunamıyor.
