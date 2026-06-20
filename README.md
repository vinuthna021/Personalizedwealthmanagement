# Personalized Wealth Management & Goal Tracker

A production-grade, full-stack wealth management platform designed to help users track investments, set financial goals, analyze asset allocation drift, simulate market scenarios, and export formatted reports.

---

## 🚀 Live Production Access

The application is deployed publicly and fully verified:

*   **Frontend Web Application**: [https://frontend-one-nu-21.vercel.app](https://frontend-one-nu-21.vercel.app) *(React SPA on Vercel)*
*   **Backend API Gateway**: [https://wealth-api-tzwd.onrender.com](https://wealth-api-tzwd.onrender.com) *(FastAPI on Render)*
*   **Interactive API Docs**: [https://wealth-api-tzwd.onrender.com/docs](https://wealth-api-tzwd.onrender.com/docs) *(Swagger UI)*

---

## 🛠️ Technology Stack

### Backend
*   **Framework**: FastAPI (Python 3.10)
*   **ORM**: SQLAlchemy 2.x
*   **Migrations**: Alembic
*   **Asynchronous Tasks**: Celery with Redis broker
*   **Reports**: ReportLab (PDF) & CSV formatting
*   **Database**: PostgreSQL
*   **Cache**: Redis

### Frontend
*   **Framework**: React (TypeScript) with Vite
*   **Charts**: Recharts (dynamic Bar/Doughnut toggle)
*   **Styling**: TailwindCSS & custom component styling
*   **Routing**: React Router

---

## 📦 Local Development Setup

To run the application locally, you can choose between native setup or Docker Compose.

### Option A: Running with Docker Compose (Recommended)

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/vinuthna021/Personalizedwealthmanagement.git
    cd Personalizedwealthmanagement
    ```
2.  **Launch the Stack**:
    ```bash
    docker compose up --build -d
    ```
3.  **Apply Database Migrations**:
    ```bash
    docker exec -it wealth_api alembic upgrade head
    ```
4.  **Access the App**:
    - Frontend: `http://localhost` (via Nginx reverse proxy)
    - Backend API: `http://localhost/api/v1`
    - Swagger Docs: `http://localhost/docs`

### Option B: Running Services Locally

#### 1. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # macOS/Linux:
    source .venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Set up local environment variables in a `.env` file (e.g., configuring local PostgreSQL and Redis URLs).
5.  Apply schema migrations:
    ```bash
    alembic upgrade head
    ```
6.  Start the FastAPI server:
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    ```

#### 2. Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to `http://localhost:5173`.

---

## 🛡️ Production Hardening Features

*   **Security Cookies**: JWT tokens (`access_token` and `refresh_token`) are delivered via HTTP-only, secure cookies with `SameSite=Strict` attributes to protect against CSRF and XSS.
*   **CDN-Level Proxying**: Vercel CDN rules proxy `/api/*` requests directly to the Render backend, preventing cross-site cookie blockages and ensuring first-party cookie exchanges in modern browsers.
*   **Dynamic Binding**: Backend Docker images dynamically bind to the `$PORT` environment variable assigned by Render, ensuring compatibility with containerized cloud environments.
