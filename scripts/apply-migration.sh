#!/bin/bash
set -e
# Applies migration-2025-08-31 to local or Daytona DB and restarts server.
# Usage:
#   # Local (docker-compose running):
#   bash scripts/apply-migration.sh
#   # Daytona (inside sandbox):
#   bash scripts/apply-migration.sh

DB_CONTAINER=${DB_CONTAINER:-zed-db-1}
MIGRATION="scripts/migration-2025-08-31-assignedTo-relation-and-rls.sql"

if ! docker ps --format '{{.Names}}' | grep -q "$DB_CONTAINER"; then
  echo "DB container $DB_CONTAINER not found. Run docker compose up -d first."
  exit 1
fi

echo "Applying $MIGRATION to postgres/default..."
docker exec -i "$DB_CONTAINER" psql -U postgres -d default < "$MIGRATION"

echo "Restarting server..."
docker restart zed-server-1 zed-worker-1 || docker compose restart

echo "Done. Verify:"
echo "  docker exec -i $DB_CONTAINER psql -U postgres -d default -c \"SELECT name,type FROM core.\\\"fieldMetadata\\\" WHERE id='8b19c2f3-036a-43b0-9d73-52d243c48218';\""
echo "  docker exec -i $DB_CONTAINER psql -U postgres -d default -c \"SELECT count(*) FROM workspace_b4ai6k0t73ulj4l40gxarowdm.person WHERE \\\"assignedToId\\\" IS NOT NULL;\""
