# Backups

This folder contains automated backups of the Zed CRM database.

- backup-latest.sql (4.8 MB) is the latest uncompressed dump from zed-db-1
- backup-*.zip is the same compressed

Restore (local or new Daytona after git pull):

docker exec -i zed-db-1 psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS default; CREATE DATABASE default;"
docker exec -i zed-db-1 psql -U postgres -d default < backups/backup-latest.sql
docker restart zed-server-1 zed-worker-1 zed-agency-worker-1

Daytona is stopped (403 Depleted credits). After top-up at app.daytona.io then cd ~/Lead-CRM && git pull && docker exec -i zed-db-1 psql -U postgres -d default < backups/backup-latest.sql

All schema migrations (scripts/migration-*.sql) are also in GitHub and re-apply via agency-worker polling, but this backup preserves the actual Person/Company/Opportunity/Task rows and core metadata as of 2026-08-31.
