# Neon PostgreSQL Production Setup Guide

This guide details the integration steps, connection requirements, and schema migration workflows for deploying the PostgreSQL database to **Neon Serverless PostgreSQL**.

---

## 1. Connection String Format

Neon connection strings require SSL/TLS enabled:

```
postgresql://<user>:<password>@<neon-host>.neon.tech/<dbname>?sslmode=require
```

### Connection Pooling (PgBouncer)
Neon provides two connection string options in its console:
1. **Direct connection (Session mode):** Best for executing schema migrations (Alembic) to prevent locking issues.
2. **Pooled connection (Transaction mode via PgBouncer):** Best for the web server API (`wealth_api`) to prevent exhausting the connection limits. Append `-pooler` or use the pooler host suffix provided by Neon.

---

## 2. Production Environment Variable Setup

Expose the database string to the Render backend service by setting `DATABASE_URL` in the Render dashboard environment configs:

```env
DATABASE_URL=postgresql://wealth_user:password@ep-cool-host-pooler.us-east-2.aws.neon.tech/wealth_db?sslmode=require
```

---

## 3. Applying Alembic Migrations

To run database migrations from your local environment targeting the Neon database:

```bash
# 1. Export the production database string locally
export DATABASE_URL="postgresql://wealth_user:password@ep-cool-host.us-east-2.aws.neon.tech/wealth_db?sslmode=require"

# 2. Run the Alembic migrations
alembic upgrade head
```

*Note: Use the Direct Connection string (non-pooled) when running migrations to prevent transaction failures.*

---

## 4. Rollback Instructions

If a database schema deployment fails or needs to be reverted:

```bash
# Revert the latest migration
alembic downgrade -1

# Revert to a specific revision ID
alembic downgrade [revision_id]
```
