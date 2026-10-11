# Faz Promptları – Kullanım

Her dosya, yerelde Claude Code'a **olduğu gibi yapıştırılacak** bağımsız bir prompttur.
Sıra: 00 → 01 → 02 → 03 → 04 → 05 → 06. Bir faz bitmeden sonrakine geçmeyin.

| Dosya | Faz | Durum |
|---|---|---|
| `01_faz0_kesif.md` | Sunucu kurulunca keşif ve doğrulama | Sunucu bekliyor |
| `02_faz1_sertlestirme.md` | Faz 1 iskeletinin kalıcı hale getirilmesi (kullanıcılar, 2FA) | İskelet hazır |
| `03_ui_stitch.md` | Stitch ile arayüz tasarımı ve uygulama | Stitch MCP gerekli |
| `04_faz2_oyuncu.md` | Gerçek şema ile oyuncu işlemleri | Faz 0 sonrası |
| `05_faz3_core_koprusu.md` | Core köprüsü, canlı level/exp/yang/kick/duyuru, drop reload | Core kaynağı gerekli |
| `06_faz4_drop_editoru.md` | Drop dosyaları, diff, yedek, geri alma | Faz 3 sonrası |
| `07_faz5_izleme.md` | Sunucu izleme, loglar, etkinlikler | Faz 3 sonrası |
| `08_faz6_dagitim.md` | Test, güvenlik incelemesi, dağıtım | Son |

## Mevcut durum (repo)
- `server/` Fastify + TypeScript; `web/` React + Vite. npm workspaces. Çalıştırma: `README.md`.
- `server/src/adapter/types.ts` → `GameAdapter` arayüzü. `MockAdapter` (demo) ve `MysqlAdapter` (okuma + `item_award`) var.
- `server/src/connections.ts` → Navicat benzeri bağlantı profilleri (AES-256-GCM).
- Kullanıcılar şimdilik bellekte tek `admin`; audit `server/data/audit.jsonl`.
- Kısıt: Online oyuncunun DB satırı **doğrudan UPDATE edilmez** (core belleği ezer). Canlı işlemler core köprüsü ister.

## Ortak kurallar (her prompta eklenmiştir)
- Önce kodu ve ilgili dokümanı oku, sonra değiştir. Varsayımları "doğrulanmalı" diye işaretle.
- Parametreli SQL, zod doğrulama, yetki kontrolü (`authed(perm)`), her yazma işlemi audit'e.
- Sırları (şifre, API anahtarı) koda/repoya yazma; `.env` ve şifreli depo kullan.
- Bitirmeden: `npm run typecheck`, `npm run build`, ilgili akışı tarayıcıda/curl ile dene.
- Küçük, anlamlı commit'ler; PR'ı ben istemeden açma.
