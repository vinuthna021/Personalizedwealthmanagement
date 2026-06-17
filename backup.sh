#!/usr/bin/env bash
# ========================================================
# Database Backup Script
# ========================================================

set -eo pipefail

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/wealth_backup_${TIMESTAMP}.sql"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "Starting database backup..."

# Execute pg_dump within the running postgres container
# Note: uses pg_dump -U wealth_admin to dump the database wealth_db
docker exec -t wealth_db pg_dump -U wealth_admin wealth_db > "${BACKUP_FILE}"

echo "Backup complete! File saved to: ${BACKUP_FILE}"

# Optional: clean up backups older than 30 days
find "${BACKUP_DIR}" -name "wealth_backup_*.sql" -type f -mtime +30 -delete
echo "Cleaned up old backups."
