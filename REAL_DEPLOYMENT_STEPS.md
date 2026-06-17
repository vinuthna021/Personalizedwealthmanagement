# Real Deployment Steps Guide

This guide provides the complete, step-by-step setup and deployment instructions to provision and deploy the Personalized Wealth Management & Goal Tracker application from scratch to live cloud environments.

---

## 1. Create Neon Database

To set up a production-ready serverless PostgreSQL database:
1. Log in to the [Neon Console](https://console.neon.tech/).
2. Click **Create Project**.
3. Set the **Project Name** (e.g., `personalized-wealth-db`) and select your preferred database version (PostgreSQL 15 or 16).
4. Select a cloud region closest to your users or closest to the Render region (e.g., US East / Oregon depending on Render setup).
5. Click **Create Project**.
6. In the project dashboard, copy the **Connection String**.
   - **For web server execution (Pooling)**: Select the connection string containing the `-pooler` suffix (transaction mode via PgBouncer).
   - **For migrations (Direct)**: Toggle the Connection Details to show the raw/direct session mode connection string (without `-pooler` suffix).
7. Save both connection strings securely.

---

## 2. Create Upstash Redis Instance

To set up a production-ready serverless Redis cache and task queue:
1. Log in to the [Upstash Console](https://console.upstash.com/).
2. Select **Redis** -> click **Create Database**.
3. Set the **Name** (e.g., `wealth-cache`) and select the region matching your database/backend.
4. Keep the default settings and click **Create**.
5. In the database dashboard, scroll to the **Node Redis** or **Redis Client** connection section and locate your connection URL.
6. Make sure to toggle **SSL (TLS)** enabled.
7. Note down the secure Redis connection URL, which will look like:
   ```
   rediss://default:<password>@<upstash-host>.upstash.io:<port>
   ```
   *(Ensure you use the `rediss://` schema instead of `redis://` to comply with Upstash's TLS-only requirements).*

---

## 3. Create Render Service (Backend API & Celery Worker)

We will deploy both the FastAPI API Server and the Celery Worker using Render's Blueprint orchestration or manual creation.

### Option A: Blueprint Deployment (Recommended)
1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Click **Blueprints** -> **New Blueprint Instance**.
3. Connect your GitHub repository `https://github.com/vinuthna021/Personalizedwealthmanagement`.
4. Enter the required environment secrets when prompted:
   - `DATABASE_URL`: Use the Neon **pooled** connection string.
   - `REDIS_URL`: Use the Upstash Redis connection string.
   - `JWT_SECRET_KEY` and `JWT_REFRESH_SECRET_KEY`: High-entropy 256-bit hexadecimal keys (generate via `openssl rand -hex 32` locally).
   - `BACKEND_CORS_ORIGINS`: JSON list containing your Vercel deployment URL (e.g., `["https://personalized-wealth-management.vercel.app"]`).
5. Click **Approve**. Render will automatically build the backend Docker container and provision both the `wealth-api` web service and `wealth-worker` background task service.

### Option B: Manual Service Creation
If you prefer manual provisioning:
1. **FastAPI Web Service**:
   - Select **New** -> **Web Service** -> Connect your GitHub repository.
   - Set Name to `wealth-api`.
   - Set Runtime to `Docker`.
   - Set Docker Context to `backend`, Dockerfile Path to `Dockerfile`.
   - Add all environment variables (DATABASE_URL, REDIS_URL, JWT_SECRET_KEY, JWT_REFRESH_SECRET_KEY, SECURE_COOKIES=true, BACKEND_CORS_ORIGINS).
   - Under Advanced Settings, set the **Health Check Path** to `/health`.
2. **Celery Worker Background Service**:
   - Select **New** -> **Background Worker** -> Connect your GitHub repository.
   - Set Name to `wealth-worker`.
   - Set Runtime to `Docker`.
   - Set Docker Context to `backend`, Dockerfile Path to `Dockerfile`.
   - Set Start Command to `celery -A app.celery_app.celery_app worker -B --loglevel=info`.
   - Add environmental variables (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET_KEY`, `JWT_REFRESH_SECRET_KEY`, `SECURE_COOKIES=true`).

---

## 4. Run Alembic Migrations

Once the Neon database is provisioned, apply the schema migrations:
1. Open a terminal in your local environment.
2. Export your **Direct Connection String** (non-pooled) to ensure migrations execute without PgBouncer transaction conflicts:
   ```bash
   export DATABASE_URL="postgresql://wealth_user:password@ep-cool-host.us-east-2.aws.neon.tech/wealth_db?sslmode=require"
   ```
3. Run Alembic upgrade command:
   ```bash
   alembic upgrade head
   ```
4. Verify the database tables (`users`, `goals`, `investments`, `transactions`, `recommendations`, `simulations`) are created in your Neon console SQL Editor.

---

## 5. Create Vercel Project

To deploy the React SPA frontend to Vercel:
1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** -> **Project**.
3. Select your repository `Personalizedwealthmanagement`.
4. Configure the settings:
   - **Framework Preset**: `Vite` (automatically detected).
   - **Root Directory**: Select `frontend` (crucial since the React SPA resides in the `frontend` subdirectory).
   - **Build Command**: `npm run build` (or `tsc && vite build`).
   - **Output Directory**: `dist`.
5. Under Environment Variables:
   - Since the frontend communicates via relative paths proxied by CDN rewrites, no custom client-side variables (such as `VITE_API_URL` which defaults to `/api/v1`) are needed.
6. Click **Deploy**. Vercel will install dependencies, build client assets, and assign a default `<project-name>.vercel.app` domain.

---

## 6. Configure Vercel Environment Variables & Rewrites

To resolve cookie transmission and CORS blocks, redirect `/api/*` requests to your live Render backend URL:
1. Open the [vercel.json](file:///c:/Users/Srivi/Desktop/Personalized-WealthManagement/vercel.json) file in your codebase.
2. Edit the `destination` property under the `/api/:path*` source to match your deployed Render backend API service URL:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://your-deployed-render-service.onrender.com/api/:path*"
       },
       {
         "source": "/((?!api/|assets/|favicon.ico|vite.svg).*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
3. Commit and push this change to your repository. Vercel will automatically redeploy with the updated rewrite rule.

---

## 7. Verify Application End-to-End

Once both deployments are active, perform live checkups:
1. **Frontend Health**: Navigate to your public Vercel URL (e.g. `https://my-app.vercel.app`). Confirm the site loads and the login/registration screen displays correctly.
2. **Backend API Health**: Navigate to `https://your-deployed-render-service.onrender.com/health` in a browser or curl client. Confirm it returns `{"status": "healthy"}`.
3. **Swagger API Docs Health**: Navigate to `https://your-deployed-render-service.onrender.com/docs`. Confirm that the Swagger UI parses, renders, and loads all endpoints successfully.
4. **End-to-End Connectivity**: 
   - Register a new user on your Vercel URL.
   - Verify that you are successfully authenticated and redirected to the dashboard.
   - Inspect the cookies list in browser DevTools to ensure `access_token` and `refresh_token` are successfully stored with `Secure`, `HttpOnly`, and `SameSite=Strict` flags active.
