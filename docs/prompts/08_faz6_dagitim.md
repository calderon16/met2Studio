# Faz 6 – Sertleştirme, test ve dağıtım

`docs/prompts/00_README.md` oku. Tüm fazlar bittikten sonra çalıştır.

Yapılacaklar:
1. **Güvenlik incelemesi**: `security-review` skill'ini çalıştır; ayrıca elle: OWASP Top 10 kontrol listesi (kimlik doğrulama, yetki atlama [her route'ta `authed` var mı — otomatik test ile tara], SQL enjeksiyonu, XSS, CSRF, SSRF, hız sınırı, bağımlılık açıkları `npm audit`). Çıktı: `docs/GUVENLIK.md` (bulgular + giderilenler + kabul edilen riskler).
2. **Yetki testi matrisi**: her rol × her endpoint için beklenen 200/403 tablosu ve otomatik test.
3. **Test kapsamı**: birim + entegrasyon (docker `mariadb` + sahte köprü sunucusu) + uçtan uca (Playwright: giriş+2FA, oyuncuya item, drop düzenle-uygula-geri al). CI için `.github/workflows/ci.yml` (typecheck, test, build).
4. **Dağıtım**: `Dockerfile` (çok aşamalı; web build'i server'dan statik servis edilir veya nginx), `docker-compose.yml` (panel + panel verisi volume), `.env.example` (tüm değişkenler açıklamalı: `JWT_SECRET`, `ADMIN_PASSWORD`, `ALLOWED_IPS`, `CORS_ORIGIN`, köprü ayarları), nginx örneği (HTTPS/Let's Encrypt, `X-Forwarded-*`, güvenlik başlıkları: CSP, HSTS, `X-Frame-Options`), systemd/pm2 alternatifi.
5. **Yedek ve kurtarma**: `panel.db` ve `backups/drops` için günlük yedek betiği + geri yükleme talimatı; `docs/OPERASYON.md` (kurulum, güncelleme, sır yenileme [JWT, bridge secret, DB şifresi], olay müdahalesi, "panel ele geçirildi" kontrol listesi).
6. **Gözlemlenebilirlik**: yapılandırılmış log (pino), hata izleme kancası, `/healthz` ve `/readyz` (DB ve köprü durumu).
7. Son kontrol: yeni bir makinede sıfırdan kurulumu `docs/OPERASYON.md`'ye göre dene, eksik adımları düzelt.

Bitti sayılır: CI yeşil, güvenlik raporu yazılı ve yüksek bulgu yok, docker-compose ile tek komutta ayağa kalkıyor, yedek→geri yükleme denendi.
