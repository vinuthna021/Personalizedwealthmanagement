# Vercel Frontend Production Deployment Guide

This guide details the step-by-step process to deploy the React SPA frontend to **Vercel**.

---

## 1. Prerequisites
1. A **Vercel** account connected to your GitHub account.
2. The backend service running on Render (copy the public URL, e.g. `https://wealth-api.onrender.com`).

---

## 2. Setting Up Vercel Redirects

Before deploying, make sure that `vercel.json` in the root (or `frontend/vercel.json`) has the correct target URL for your Render backend:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR_ACTUAL_RENDER_API_SERVICE.onrender.com/api/:path*"
    }
  ]
}
```

*Note: This routes all frontend requests matching `/api/*` directly to the Render endpoint at the CDN level. This maintains first-party domain status for cookie exchanges.*

---

## 3. Deployment Steps

1. Navigate to the **Vercel Dashboard** → click **Add New** → **Project**.
2. Select your repository `Personalizedwealthmanagement`.
3. Configure the Project Settings:
   - **Framework Preset:** `Vite` (automatically detected).
   - **Root Directory:** Select `frontend` (crucial since the React SPA resides in the `frontend` subdirectory).
   - **Build Command:** `npm run build` (or `tsc && vite build`).
   - **Output Directory:** `dist`.
4. Environment Variables:
   - Since Vercel redirects API calls using the `vercel.json` rewrites rules, you do not need to configure any custom client-side env variables (like `VITE_API_URL` which defaults to `/api/v1` in `frontend/.env.production`).
5. Click **Deploy**. Vercel will download dependencies, execute TypeScript checks, compile assets, and publish your site to a public `<project-name>.vercel.app` domain.
