# CORS Configuration Guide

This document describes how Cross-Origin Resource Sharing (CORS) is configured for the Personalized Wealth Management & Goal Tracker application.

---

## 1. How CORS Works in this Architecture

The application uses a split frontend/backend architecture:
- **Frontend**: Deployed to **Vercel** (`https://<vercel-project>.vercel.app`)
- **Backend**: Deployed to **Render** (`https://<render-service>.onrender.com`)

Because these reside on different domains, cross-origin web browsers enforce security policies that would restrict requests unless appropriate headers are returned by the backend.

Furthermore, because authentication is handled via **HttpOnly cookies**, cross-site third-party cookie restrictions in modern browsers will block JWT token transmission unless requests are routed correctly.

### Two Options for CORS / Request Routing

To address these restrictions, the architecture supports two options:

#### Option A: Vercel CDN-Level Proxy Rewrites (Recommended)
By using the rewrite rules defined in `vercel.json`, all frontend API requests to `/api/*` are intercepted by Vercel's Edge network and proxied to the Render backend at the CDN layer.
- **Client Request**: `https://your-app.vercel.app/api/v1/auth/login`
- **Vercel CDN Proxies to**: `https://your-backend.onrender.com/api/v1/auth/login`
- **Result**: To the browser, the request is **Same-Origin** (same domain, same port). The browser sends and receives cookies without any third-party blockages, and no CORS preflight requests (`OPTIONS`) are triggered.

#### Option B: Direct Cross-Origin API Calls
If you choose to direct your frontend to call the Render backend URL directly (e.g. settings `VITE_API_URL=https://your-backend.onrender.com/api/v1`):
1. Browser triggers CORS preflight validation checks.
2. The Render backend must have the Vercel domain in its `BACKEND_CORS_ORIGINS` list.
3. Cookies will require `SameSite=None` and `Secure=True` (which is less secure and blocked by default in some privacy-oriented browsers).

---

## 2. Backend CORS Settings

The FastAPI backend uses `CORSMiddleware` to authorize cross-origin requests.

### Configuration Parameters
These settings are loaded inside [config.py](file:///c:/Users/Srivi/Desktop/Personalized-WealthManagement/backend/app/core/config.py):
- `allow_credentials=True`: Essential for sending/receiving HttpOnly cookies.
- `allow_methods=["*"]`: Permissive of standard REST operations.
- `allow_headers=["*"]`: Permissive of authorization and content-type headers.

### Allowed Origins
The list of origins allowed to perform cross-origin requests is set via the `BACKEND_CORS_ORIGINS` variable. The default values in code are:
```python
BACKEND_CORS_ORIGINS: List[str] = [
    "http://localhost",
    "http://localhost:5173",
    "https://localhost",
    "https://personalizedwealthmanagement.vercel.app",
    "https://personalizedwealthmanagement-vinuthna021.vercel.app"
]
```

---

## 3. Configuring Allowed Origins in Production

When deploying to Render, you **must** configure the `BACKEND_CORS_ORIGINS` environment variable to include your actual Vercel deployment URL.

You can set this in the **Render Dashboard** (under Environment Variables) or inside `render.yaml`.

### Formats Supported

The backend uses a validator that supports two formats:

#### 1. Comma-Separated List (Simple)
Simply separate domains with commas (no spaces inside elements):
```env
BACKEND_CORS_ORIGINS=https://my-app.vercel.app,https://my-custom-domain.com
```

#### 2. JSON Array List (Advanced)
Use a JSON-valid list representation:
```env
BACKEND_CORS_ORIGINS=["https://my-app.vercel.app", "https://my-custom-domain.com"]
```

---

## 4. Verification Check

To verify that your CORS configurations are working:
1. Open your browser console on the Vercel URL.
2. Trigger an API call (e.g., login).
3. If you see:
   `Access-Control-Allow-Origin header is present on the requested resource...` or a `403 Forbidden` CORS error, ensure your Vercel URL matches the backend `BACKEND_CORS_ORIGINS` exactly (including `https://` and excluding any trailing slashes `/`).
