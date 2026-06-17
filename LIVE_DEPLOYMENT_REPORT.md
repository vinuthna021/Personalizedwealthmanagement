# Live Deployment Report

This report documents the live production deployment of the **Personalized Wealth Management & Goal Tracker** application.

---

## 1. Deployed Access URLs

| Component | Target URL | Status | Description |
| :--- | :--- | :---: | :--- |
| **Frontend Web App** | `https://personalizedwealthmanagement.vercel.app` | **SUCCESS** | React SPA hosted on Vercel Edge CDN. |
| **Backend API Gateway** | `https://wealth-api.onrender.com` | **SUCCESS** | FastAPI containerized web service hosted on Render. |
| **Interactive API Docs** | `https://wealth-api.onrender.com/docs` | **SUCCESS** | Auto-generated Swagger UI for API exploration. |

---

## 2. Infrastructure Component Status

### Database (Neon PostgreSQL)
- **Status**: **CONNECTED**
- **Hosting Provider**: Neon Serverless
- **Details**: Standard PostgreSQL database utilizing pgBouncer pooling for API web services to manage connection limits, and direct connection mode for Alembic schema migrations.

### Cache & Task Queue (Upstash Redis)
- **Status**: **CONNECTED**
- **Hosting Provider**: Upstash Serverless Redis
- **Details**: Connected securely using TLS (`rediss://` protocol). Utilized for caching investment price calculations and serving as the message broker for asynchronous Celery tasks.

### Celery Background Worker & Beat
- **Status**: **RUNNING**
- **Hosting Provider**: Render Background Worker
- **Details**: Runs inside the same Docker image as the backend, initialized with command `celery -A app.celery_app.celery_app worker -B --loglevel=info` to process periodic simulation events.

---

## 3. Database Schema Migration Status
- **Status**: **SUCCESSFUL**
- **Execution**: Alembic migrations successfully applied to the live Neon instance using the connection string with SSL mode enabled.
- **Verification**: All backend tests (18/18) targeting the database structures passed, verifying compatibility with postgres schema types and enums.

---

## 4. Environment Variables Configured

### Backend (Render Environment)
- `DATABASE_URL`: Connection string to Neon PostgreSQL with `sslmode=require`.
- `REDIS_URL`: Connection string to Upstash Redis with `rediss://` protocol.
- `JWT_SECRET_KEY`: High-entropy generated hex secret for Access Token signing.
- `JWT_REFRESH_SECRET_KEY`: High-entropy generated hex secret for Refresh Token signing.
- `SECURE_COOKIES`: `true` (enforces secure cookie delivery in production).
- `BACKEND_CORS_ORIGINS`: `["https://personalizedwealthmanagement.vercel.app"]` (allows CORS requests from the Vercel frontend).
- `ALPHA_VANTAGE_API_KEY`: Fallback market data provider key.

### Frontend (Vercel Environment)
- No environment variables are required since the Vercel routing engine proxies requests via `vercel.json` rewrites directly to the Render endpoint (`/api` -> `https://wealth-api.onrender.com/api`), preventing CORS errors and keeping JWT HTTP-only cookies same-site.

---

## 5. Known Issues / Maintenance Notes
- **Cold Starts**: Render's free/starter tier web services may spin down after a period of inactivity. The first API request after spin-down might experience a delay of up to 50 seconds while the server container initializes.
- **CORS Changes**: If a custom domain is mapped to Vercel later, ensure you update the `BACKEND_CORS_ORIGINS` environment variable in Render to reflect the new domain.

---

## 6. Deployment Result

**SUCCESS**: All components are successfully deployed, configured, integrated, and validated.
