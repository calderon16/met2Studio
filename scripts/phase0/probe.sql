-- Faz 0 keşif: SADECE OKUMA. Her veritabanında çalıştırın:
--   mysql -u <kullanici> -p -N < scripts/phase0/probe.sql > probe_output.txt
-- Çıktıyı (şifre/hesap verisi içermez) bana iletin.

SELECT VERSION() AS mysql_version;
SHOW DATABASES;

-- Tablo ve kolon şeması (account, player, common, log)
SELECT table_schema, table_name, table_rows
FROM information_schema.tables
WHERE table_schema IN ('account','player','common','log')
ORDER BY table_schema, table_name;

SELECT table_schema, table_name, column_name, column_type, column_key
FROM information_schema.columns
WHERE table_schema IN ('account','player','common','log')
  AND table_name IN ('player','item','item_award','item_proto','mob_proto','account','gmlist','locale','priv_settings')
ORDER BY table_schema, table_name, ordinal_position;

-- item_award var mı? (item gönderimi için anahtar tablo)
SELECT COUNT(*) AS item_award_exists
FROM information_schema.tables
WHERE table_schema = 'player' AND table_name = 'item_award';

-- GM yetki tablosu (kimlik bilgisi içermez, sadece seviye dağılımı)
SELECT mAuthority, COUNT(*) FROM common.gmlist GROUP BY mAuthority;
