# Live Deployment Report

This report documents the live production deployment of the **Personalized Wealth Management & Goal Tracker** application.

---

## 1. Deployed Access URLs

| Component | Target URL | Status | Description |
| :--- | :--- | :---: | :--- |
| **Frontend Web App** | `https://frontend-one-nu-21.vercel.app` | **SUCCESS (HTTP 200)** | React SPA hosted on Vercel Edge CDN. |
| **Backend API Gateway** | `https://wealth-api-tzwd.onrender.com` | **SUCCESS (HTTP 200)** | FastAPI containerized web service hosted on Render. |
| **Interactive API Docs** | `https://wealth-api-tzwd.onrender.com/docs` | **SUCCESS (HTTP 200)** | Auto-generated Swagger UI for API exploration. |

---

## 2. Infrastructure Component Status

### Database (Render PostgreSQL)
- **Status**: **CONNECTED** (Oregon region)
- **Details**: Managed PostgreSQL instance (`wealth-db`) provisioned on Render. Standard pgBouncer pooling is handled internally by Render.

### Cache & Task Queue (Render Redis)
- **Status**: **CONNECTED** (Oregon region)
- **Details**: Managed Redis Key Value instance (`wealth-redis`) provisioned on Render. Used for caching and serving as the message broker for Celery tasks.

### Celery Background Worker & Beat
- **Status**: **PENDING BILLING ACTIVATION**
- **Details**: Background workers are a paid service on Render and require payment details to be attached to the account. Once card information is added in the [Render Billing Dashboard](https://dashboard.render.com/billing), the Celery worker service (`wealth-worker`) can be spun up using the settings already configured in `render.yaml`.

---

## 3. Database Schema Migration Status
- **Status**: **SUCCESSFUL**
- **Execution**: Alembic migrations successfully applied to the live Render database instance from the local environment using the external connection string:
  `INFO  [alembic.runtime.migration] Running upgrade 86644911451a -> 38992268753e, add_recommendations`

---

## 4. Environment Variables Configured

### Backend (Render Environment)
- `DATABASE_URL`: `postgresql://wealth_admin:PASSWORD@dpg-d8rcacflk1mc73bo8es0-a/wealth_db_306e` (internal connection string)
- `REDIS_URL`: `redis://red-d8rca4j6sc1c73b3o5n0:6379` (internal connection string)
- `JWT_SECRET_KEY`: `b9688eb62d556df2e737bb9709849202`
- `JWT_REFRESH_SECRET_KEY`: `e7b99c0a6b1076b1f20d52bc00b21a0f`
- `SECURE_COOKIES`: `true`
- `BACKEND_CORS_ORIGINS`: `["https://frontend-one-nu-21.vercel.app"]`

### Frontend (Vercel Environment)
- Requests matching `/api/*` are proxy-forwarded via `vercel.json` rewrites directly to `https://wealth-api-tzwd.onrender.com/api/*`, keeping the cookies same-site and secure.

---

## 5. Known Issues / Maintenance Notes
- **Cold Starts**: Render's free tier web services spin down after 15 minutes of inactivity. The first API request after spin-down might experience a delay of up to 50 seconds while the server container initializes.
- **Celery Tasks**: Background Celery worker tasks will start running as soon as you attach a card on your Render dashboard and launch the `wealth-worker` service.

---

## 6. Deployment Result

**SUCCESS**: Frontend, Backend, Database, and Cache are successfully deployed, configured, integrated, and validated.
