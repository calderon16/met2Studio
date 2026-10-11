# Faz 0 – Keşif

Amaç: Mimariyi tahmin değil gerçeğe göre kesinleştirmek. Hiçbir şey değiştirilmez, sadece okunur.

## Durum
- [x] Stitch MCP bağlandı (yerel config; API anahtarı depoya yazılmadı)
- [x] Salt-okunur keşif betikleri hazır
- [ ] Sunucu/core bilgisi sizden alınacak (aşağıda)
- [ ] Mimari kararı (item_award / core köprüsü / bot) kesinleştirme

## Benden bekleyen çıktılar (siz iletin)
1. **Core nedir ve kaynağı elinizde mi?** (ad, kaynak repo linki ya da `game/src` klasörü). Depoya özel repo olarak ekleyebilirsiniz.
2. `scripts/phase0/probe.sql` çıktısı (şema, `item_award` var mı, GM seviyeleri).
3. `scripts/phase0/probe_server.sh` çıktısı (config maskelenir, drop dosyalarının yeri, kaynak varlığı).
4. `mob_drop_item.txt`, `drop_item_group.txt`, `common_drop_item.txt` dosyalarından **birkaç örnek satır** (tamamı değil).
5. Sunucu işletim sistemi (FreeBSD/Linux) ve panelin aynı makinede olup olmayacağı.

## Karar ağacı
- `item_award` var + core kaynak var → Önerilen hibrit (item_award + core köprüsü + `reload drop`).
- `item_award` yok + kaynak var → core'a item_award benzeri teslim + köprü.
- Kaynak yok → item/level için GM botu (yedek), drop için dosya + kanal restart.

## Güvenlik notu
Sohbette paylaşılan API anahtarı (Stitch) görüntülenmiş sayılır; Google Cloud'dan **yenilemeniz (rotate)** önerilir. Bu anahtar depoya eklenmedi.
