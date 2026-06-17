# Docker Production Configuration Review

This document contains the containerization and orchestration review for the Personalized Wealth Management stack, analyzing the `Dockerfile` specifications and `docker-compose.yml` configurations.

---

## 1. Audit Findings & Verification

| Element | Status | Evaluation |
| :--- | :---: | :--- |
| **Restart Policies** | **VERIFIED** | Every container is configured with `restart: always` in `docker-compose.yml`. This ensures auto-recovery on system reboot or unexpected container crashes. |
| **Health Checks** | **VERIFIED** | PostgreSQL uses `pg_isready -U wealth_admin -d wealth_db` and Redis uses `redis-cli ping`. Dependents (api-server, celery-worker) use `condition: service_healthy` to prevent startup race conditions. |
| **Build Contexts** | **VERIFIED** | Contexts map correctly to subdirectories (`./backend` and `./frontend` for the respective Dockerfiles). |
| **Persistent Volumes** | **VERIFIED** | `postgres_data` and `redis_data` volumes are properly mounted to persist ledger files across container recreations. |

---

## 2. Hardening Recommendations

### Network Isolation (Critical Security Improvement)
Currently, all containers share the same default network interface. In production, Nginx (which is web-facing) should **never** share network access with PostgreSQL or Redis containers.
We recommend defining two isolated Docker networks:
1. `frontend_net`: Shared between `nginx` and `api-server`.
2. `backend_net`: Shared between `api-server`, `celery-worker`, `db`, and `redis`.

This ensures that if the Nginx container is compromised, the attacker has no network routing path to target database tables or cash caches directly.

### Multi-stage Builds for Frontend
Verify the `frontend/Dockerfile` uses a multi-stage approach to avoid shipping npm development dependencies (and tools like vite compiler) to production. The current `frontend/Dockerfile` correctly builds in node stage and copies only `/app/dist` static assets to the lightweight `/usr/share/nginx/html` Nginx container, which is excellent.

### Drop Root Privileges
In both backend and frontend Dockerfiles, processes currently run as root. It is recommended to create a non-root system user inside the containers and drop privileges before executing command entrypoints.
For example, inside backend Dockerfile:
```dockerfile
RUN groupadd -r wealth && useradd -r -g wealth wealth
USER wealth
```
