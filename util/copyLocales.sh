set -euo pipefail
SRC="/Users/daniel/Downloads/Open Communities Backup Aug 21 2025/data.db"
DST="../pb_data/data.db"
BACKUP_DIR="../pb_data/backups"
mkdir -p "$BACKUP_DIR"
if [[ ! -f "$SRC" ]]; then
  echo "ERROR: source DB not found: $SRC" >&2
  exit 2
fi
if [[ -f "$DST" ]]; then
  ts=$(date +%Y%m%d%H%M%S)
  cp -v "$DST" "$BACKUP_DIR/data.db.bak.$ts"
  echo "Backup created: $BACKUP_DIR/data.db.bak.$ts"
else
  echo "Destination DB not found; creating empty DB at $DST"
  sqlite3 "$DST" "VACUUM;"
fi
# Confirm sqlite3 exists
if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "ERROR: sqlite3 CLI not found in PATH" >&2
  exit 3
fi
max_retries=5
delay=2
attempt=1
while :; do
  echo "Attempt $attempt: copying tables from $SRC into $DST"
  # Temporarily allow failures so we can inspect sqlite3 output and retry on locked DB
  set +e
  output=$(sqlite3 "$DST" 2>&1 <<SQL
PRAGMA busy_timeout=10000;
PRAGMA foreign_keys=off;
ATTACH DATABASE '$SRC' AS src;
BEGIN;
-- For each table, create if missing (schema clone without data) then insert or replace
CREATE TABLE IF NOT EXISTS cities AS SELECT * FROM src.cities WHERE 0;
CREATE TABLE IF NOT EXISTS countries AS SELECT * FROM src.countries WHERE 0;
CREATE TABLE IF NOT EXISTS states AS SELECT * FROM src.states WHERE 0;
-- Copy data (use INSERT OR REPLACE to prefer src rows when keys conflict)
-- Use explicit column lists to avoid positional mismatches between source and destination
-- Source cities columns: created, id, latitude, longitude, name, state, updated, country
INSERT OR REPLACE INTO cities(id, created, latitude, longitude, name, state, updated, country)
  SELECT id, created, latitude, longitude, name, state, updated, country FROM src.cities;
-- Source countries columns: code, created, flag, id, latitude, longitude, name, updated
INSERT OR REPLACE INTO countries(id, code, name, flag, latitude, longitude, created, updated)
  SELECT id, code, name, flag, latitude, longitude, created, updated FROM src.countries;
-- Source states columns: code, country, created, id, latitude, longitude, name, updated
INSERT OR REPLACE INTO states(id, code, country, name, latitude, longitude, created, updated)
  SELECT id, code, country, name, latitude, longitude, created, updated FROM src.states;
COMMIT;
DETACH DATABASE src;
PRAGMA foreign_keys=on;
SQL
  )
  rc=$?
  set -e
  if [[ $rc -eq 0 ]]; then
    echo "Copy complete."
    break
  fi
  if echo "$output" | grep -qi "database .* is locked\|database is locked"; then
    echo "Database locked. Output:"
    echo "$output"
    if [[ "$attempt" -ge "$max_retries" ]]; then
      echo "Exceeded $max_retries attempts; aborting."
      exit 4
    fi
    echo "Retrying in $delay seconds..."
    sleep $delay
    attempt=$((attempt+1))
    delay=$((delay*2))
    continue
  fi
  # Unexpected error - print and exit
  echo "SQLite error (rc=$rc):"
  echo "$output"
  exit $rc
done