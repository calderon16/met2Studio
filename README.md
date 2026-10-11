# Metin2Studio

Metin2 sunucuları için web tabanlı GM paneli (oyuncu yönetimi, drop düzenleme, sunucu izleme).
Rapor: `docs/RAPOR.md` · Tasarım promptu: `docs/STITCH_PROMPT.md` · Keşif: `docs/FAZ0_KESIF.md`

## Çalıştırma (geliştirme)
```sh
npm install
npm run dev:server   # http://127.0.0.1:3001  (dev'de admin şifresi konsola yazılır; ADMIN_PASSWORD ile belirlenebilir)
npm run dev:web      # http://localhost:5173
```
Production için `NODE_ENV=production`, `JWT_SECRET` ve `ADMIN_PASSWORD` zorunludur. Panel HTTPS + VPN/IP kısıtı arkasında çalıştırılmalıdır.

## Mimari
- `server/src/adapter/types.ts`: oyunla konuşan `GameAdapter` arayüzü.
  - `MockAdapter`: sunucu yokken demo verisi.
  - `MysqlAdapter`: Navicat benzeri bağlantı ekranından girilen MySQL bilgileriyle bağlanır (okuma + `item_award` ile item teslimi). Tablo/kolon adları gerçek sunucuyla **doğrulanmalı**.
  - Level/EXP/yang/kick/duyuru/drop canlı uygulama: core köprüsü (Faz 3) gelene kadar kapalı.
- Bağlantı şifreleri `server/data/` altında AES-256-GCM ile şifreli tutulur (git'e girmez).
- Roller: owner, admin, gm, mod. Tüm işlemler `server/data/audit.jsonl` dosyasına yazılır.
