#!/bin/sh
# Faz 0 keşif: SADECE OKUMA. Sunucu dosya dizininde çalıştırın (ör. /usr/metin2/ ).
# Kullanım: sh probe_server.sh /yol/sunucu > server_probe.txt
ROOT="${1:-.}"
echo "== Çekirdek ikilileri =="; find "$ROOT" -maxdepth 4 -type f \( -name game -o -name db -o -name 'game*' -o -name 'db*' \) -perm -u+x 2>/dev/null | head -20
echo "== Config (CONFIG dosyaları, şifre satırları maskelenir) =="
find "$ROOT" -maxdepth 4 -name CONFIG -type f 2>/dev/null | while read f; do echo "--- $f"; sed -E 's/(PASSWORD|PASSWD|PASS|SECRET|ADMIN_PAGE_PASSWORD)[ =\t]+.*/\1 = ****/I' "$f"; done
echo "== Drop/proto dosyaları =="
find "$ROOT" -type f \( -name 'mob_drop_item.txt' -o -name 'drop_item_group.txt' -o -name 'common_drop_item.txt' -o -name 'special_item_group.txt' -o -name 'mob_proto*' -o -name 'item_proto*' \) 2>/dev/null
echo "== Kaynak kod var mı? =="
find "$ROOT" -type f \( -name 'cmd_gm.cpp' -o -name 'cmd.cpp' -o -name 'ItemAwardManager.cpp' \) 2>/dev/null
echo "== Git/Sürüm =="; git -C "$ROOT" log -1 --oneline 2>/dev/null
