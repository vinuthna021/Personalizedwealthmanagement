# Render Backend & Celery Production Deployment Guide

This guide details the step-by-step process to deploy the FastAPI API server and Celery worker stack to **Render** using Docker containerization.

---

## 1. Prerequisites
1. A **Render** account connected to your GitHub account.
2. A deployed **Neon PostgreSQL** database connection string (see `NEON_SETUP.md`).
3. A deployed **Upstash Redis** cache connection string (see `UPSTASH_SETUP.md`).

---

## 2. Option A: Blueprint Deployment (Recommended)
Render Blueprints automate service orchestration using the `render.yaml` spec in the codebase root.

1. Navigate to the **Render Dashboard** → click **Blueprints** → **New Blueprint Instance**.
2. Select your repository `Personalizedwealthmanagement`.
3. Render will parse `render.yaml` and discover two services: `wealth-api` and `wealth-worker`.
4. Enter the required environment secrets when prompted:
   - `DATABASE_URL`: Your Neon pooled connection string.
   - `REDIS_URL`: Your Upstash Redis connection string.
   - `JWT_SECRET_KEY` and `JWT_REFRESH_SECRET_KEY`: Strong generated hex keys.
   - `BACKEND_CORS_ORIGINS`: JSON list containing your Vercel deployment URL (e.g., `["https://personalized-wealth-management.vercel.app"]`).
5. Click **Approve**. Render will build the Docker container and start both services.

---

## 3. Option B: Manual Dashboard Deployment
If you prefer not to use blueprints, create the services manually:

### Service 1: Web Service (FastAPI API Server)
1. **New Web Service** → Select your Repository.
2. Set **Name** to `wealth-api`.
3. Set **Runtime** to `Docker`.
4. Set **Docker Context** to `backend`.
5. Set **Dockerfile Path** to `Dockerfile`.
6. Add the environment variables listed in `backend/.env.production.example`.
7. Under Advanced, set the **Health Check Path** to `/health`.

### Service 2: Background Worker (Celery Worker)
1. **New Background Worker** → Select your Repository.
2. Set **Name** to `wealth-worker`.
3. Set **Runtime** to `Docker`.
4. Set **Docker Context** to `backend`.
5. Set **Dockerfile Path** to `Dockerfile`.
6. Set **Start Command** to:
   `celery -A app.celery_app.celery_app worker -B --loglevel=info`
7. Add the environment variables (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET_KEY`, `JWT_REFRESH_SECRET_KEY`, `SECURE_COOKIES=true`).
