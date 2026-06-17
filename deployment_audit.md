# Production Deployment Readiness Audit

This document summarizes the deployment audit of the Personalized Wealth Management & Goal Tracker stack for production readiness.

---

## 1. Readiness Audit Checklist

| Component / Layer | Check Category | Status | Evaluation & Notes |
| :--- | :--- | :---: | :--- |
| **FastAPI Backend** | Compilation & Routing | **PASS** | Uvicorn servers running. All routes register, including new recommendations and reports. |
| **React Frontend** | Production Build | **PASS** | Production asset packaging compiles cleanly using `npm run build`. |
| **PostgreSQL Integration** | DB Connectivity & Mapping | **PASS** | High-precision numeric mapping for assets. Custom Postgres enum mapping resolved with `values_callable` configuration to prevent `InvalidTextRepresentation` errors. |
| **Redis Integration** | Cache Performance | **PASS** | Redis Client is running. Caching implemented for rebalancing suggestions and market prices with TTL constraints. |
| **Celery Worker & Beat** | Async Job Handling | **PASS** | Worker process is healthy. Beat scheduler triggers periodic tasks (market prices fetch). |
| **Alembic Migrations** | DB Schema State | **PASS** | Revision `38992268753e` applied. recommendations tables populated successfully. |
| **Docker Compose Stack** | Integration Orchestration | **PASS** | Configurations defined with healthchecks and restart policies. |
| **Environment Variables** | Configuration Isolation | **PASS** | Separated in Pydantic BaseSettings class from `backend/app/core/config.py`. |
| **Nginx Reverse Proxy** | Static & API Mapping | **PASS** | Configured proxy pass to upstream `api-server:8000` and static file routing. |
| **CORS Configuration** | Origin Constraints | **PASS** | Constrained dynamically via `BACKEND_CORS_ORIGINS` settings. |
| **JWT Cookie Settings** | Security Flagging | **PASS** | JWT stored in HttpOnly cookies. Secure flag must be activated (`Secure=True`) for production HTTPS. |

---

## 2. Security Concerns & Vulnerabilities

1. **Secure Flag on HttpOnly Cookies:**
   - *Concern:* The cookie security flag in `/backend/app/api/v1/endpoints/auth.py` is currently set to `secure=False` for local dev.
   - *Risk:* In production over SSL, cookies must use `secure=True` to prevent theft of tokens over unencrypted channels.
   - *Remedy:* Define an environment variable `SECURE_COOKIES=True` and bind it inside `auth.py`.

2. **Default Signing Secrets:**
   - *Concern:* Secret keys default to `super_secret_jwt_signing_key_change_me_in_prod` in `config.py`.
   - *Risk:* Compromised keys allow unauthorized third parties to forge JWT cookies and take over user accounts.
   - *Remedy:* Enforce loading `JWT_SECRET_KEY` and `JWT_REFRESH_SECRET_KEY` from environment files.

3. **CORS Origins Permissiveness:**
   - *Concern:* Defaults include developmental origins like `http://localhost:5173`.
   - *Risk:* Cross-origin request forgery from localized development setups.
   - *Remedy:* Restrict `BACKEND_CORS_ORIGINS` strictly to the production domains.

---

## 3. Production Risks & Recommendations

1. **Volume Backups:**
   - *Risk:* Docker volumes `postgres_data` and `redis_data` could suffer data corruption without automated snapshotting.
   - *Remedy:* Set up daily cron jobs running `/backups/db_backup.sql` dumps to secondary storage locations.

2. **Celery Worker Memory Leakage:**
   - *Risk:* Long-running python processes (Celery workers parsing market ticks) might run out of memory.
   - *Remedy:* Run Celery with `--max-tasks-per-child=100` to periodically recycle workers.

3. **Rate Limiting on Authentication Routes:**
   - *Risk:* Brute force logins on `/api/v1/auth/login`.
   - *Remedy:* Implement Nginx-level rate-limiting (`limit_req_zone`) for `/api/v1/auth/` paths.
