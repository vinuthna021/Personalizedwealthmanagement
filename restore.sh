#!/usr/bin/env bash
# ========================================================
# Database Restore Script
# ========================================================

set -eo pipefail

BACKUP_FILE=$1

if [ -z "${BACKUP_FILE}" ]; then
    echo "ERROR: Missing backup file argument."
    echo "Usage: ./restore.sh [path_to_backup_file.sql]"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "WARNING: This will overwrite current database values."
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Restore aborted."
    exit 1
fi

echo "Restoring database from: ${BACKUP_FILE}..."

# Feed SQL backup dump back into the database container
cat "${BACKUP_FILE}" | docker exec -i wealth_db psql -U wealth_admin -d wealth_db

echo "Database restore completed successfully!"
