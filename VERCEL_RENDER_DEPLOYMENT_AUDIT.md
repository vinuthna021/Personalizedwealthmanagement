# Vercel & Render Deployment Audit

This audit evaluates the Personalized Wealth Management codebase for compatibility with serverless deployments on **Vercel** (frontend) and **Render** (backend & Celery).

---

## 1. Compatibility Check

| Component / Parameter | Platform | Compatibility | Audit & Resolution Details |
| :--- | :--- | :---: | :--- |
| **Vite React Frontend** | Vercel | **PASS** | Vite compiles standard static files to `/dist`. Requires `vercel.json` SPA rewrite rules. |
| **FastAPI Backend** | Render | **PASS** | Runs via Dockerfile. Exposed port must dynamically adapt to Render's `$PORT` env variable. |
| **Neon PostgreSQL** | Neon | **PASS** | Standard libpq-compatible Serverless PostgreSQL. Fully compatible with SQLAlchemy and Alembic. |
| **Upstash Redis** | Upstash | **PASS** | Serverless Redis with SSL/TLS. Compatible with celery broker and redis client caching. |
| **Celery Broker & Worker**| Render | **PASS** | Can run as a Render Background Worker using the same ECR/Docker image. |
| **HttpOnly Cookies** | Cross-platform | **WARNING** | Since Vercel (`vercel.app`) and Render (`onrender.com`) have different top-level domains, cross-site HttpOnly cookie sharing is blocked by default. |

---

## 2. Blockers & Required Changes

### Blocker 1: Cross-Site Cookie Sharing
- **Problem:** Browsers reject HttpOnly cookies sent from `onrender.com` to a client running on `vercel.app` due to strict third-party cookie restrictions.
- **Resolution:** Configure **Vercel Rewrites** inside `vercel.json` so that all `/api/*` requests are proxy-passed at the CDN level to the Render URL. The browser will see them as first-party requests to the Vercel domain, enabling cookies to function perfectly.

### Blocker 2: Dynamic Port Binding in Dockerfile
- **Problem:** The current `backend/Dockerfile` exposes and binds to port `8000` statically:
  `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`
- **Resolution:** Render automatically binds to a random port provided in the `$PORT` environment variable. The entrypoint CMD must be overridden or updated to read `$PORT` (defaulting to 8000 if not set).

### Blocker 3: CORS Allowed Origins
- **Problem:** Backend's `BACKEND_CORS_ORIGINS` defaults to local address paths (`localhost`).
- **Resolution:** Must add the dynamic Vercel app domain to the allowed CORS origins list.
