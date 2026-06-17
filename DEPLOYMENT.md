# Production Deployment & Operations Guide

This document describes the production setup, Docker configuration, background services, database migration workflows, system backups, and disaster recovery procedures.

---

## 1. Architecture Overview

```
                  +------------------+
                  |  Nginx Reverse   | (Ports 80 / 443)
                  |     Proxy        |
                  +--------+---------+
                           |
            +--------------+--------------+
            |                             |
    +-------v-------+             +-------v-------+
    |  FastAPI API  |             |  React Vite   |
    |  (wealth_api) |             |  Static files |
    +-------+-------+             +---------------+
            |
    +-------+--------------+------------------+
    |                      |                  |
+---v----+             +---v----+         +---v----+
| Postgre|             | Redis  |         | Celery |
| DB     |             | Cache  |         | Worker |
+--------+             +--------+         +--------+
```

---

## 2. Environment Variables & Setup

Create a `.env` file in the production environment:

```env
# Database Configuration
POSTGRES_USER=wealth_admin
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_DB=wealth_prod
DATABASE_URL=postgresql://wealth_admin:your_secure_db_password@wealth_db:5432/wealth_prod

# Redis & Celery
REDIS_URL=redis://wealth_redis:6379/0

# Security & JWT Tokens
SECRET_KEY=your_super_secret_jwt_sign_key
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Market Data Providers
ALPHA_VANTAGE_API_KEY=your_key_here
```

---

## 3. Launching the Stack

Run the production stack in detached mode using Docker Compose:

```bash
# 1. Build and compile production images
docker compose build --no-cache

# 2. Spin up containers
docker compose up -d

# 3. Check health statuses
docker compose ps
```

---

## 4. Alembic Migration Guidelines

Database schemas must be kept in sync using Alembic:

```bash
# Run migrations to the latest revision
docker exec wealth_api alembic upgrade head

# Revert the latest migration (in case of deployment issues)
docker exec wealth_api alembic downgrade -1
```

---

## 5. Maintenance & Disaster Recovery

### Database Backups (Cron Jobs)
Automate PostgreSQL database dumps daily:

```bash
# Backup command
docker exec -t wealth_db pg_dumpall -U wealth_admin > /backups/db_backup_$(date +%F).sql
```

### Database Restore
In case of a failure, restore from a backup file:

```bash
# Restore command
cat db_backup_2026-06-16.sql | docker exec -i wealth_db psql -U wealth_admin -d wealth_prod
```

### System Maintenance Mode
During critical migrations, update Nginx configurations to redirect traffic to a static `maintenance.html` page, returning a `503 Service Unavailable` header.
