# Production Monitoring & Alerting Plan

This document details the recommended monitoring, observability, and alerting stack for the Personalized Wealth Management platform.

---

## 1. Observability Stack Overview

We recommend a standard **Prometheus + Grafana + Loki** (LGTM) stack for collecting logs, performance metrics, and container statistics.

```
+--------------------+      +------------------+      +--------------------+
|   Prometheus       |      |   Grafana Loki   |      |   Alertmanager     |
|   (Metrics Engine) |      |   (Logs Engine)  |      |   (Slack/PagerDuty)|
+---------^----------+      +--------^---------+      +---------^----------+
          |                          |                          |
          | Pull                     | Push                     | Alert
          |                          |                          |
+---------+----------+      +--------+---------+      +---------+----------+
|  Node Exporter /   |      |   Promtail       |      |    Grafana         |
|  cAdvisor          |      |   (Log Shipper)  |      |    Dashboards      |
+--------------------+      +------------------+      +--------------------+
```

---

## 2. Key Metrics & Logs to Monitor

### 1. Application & API Server (FastAPI)
- **What to Monitor:**
  - HTTP request rate, response latencies (latency percentiles: p95, p99), and error rate (5xx counts).
  - Active database session pool sizes and transaction timings.
- **Log Source:** Uvicorn stderr logs (`docker logs wealth_api`).
- **Telemetry Collection:** Integrate `prometheus-fastapi-instrumentator` middleware to expose `/metrics` endpoint.

### 2. Reverse Proxy (Nginx)
- **What to Monitor:**
  - Rate-limit zones drops (`limit_req` drops) to detect potential DDoS or brute-force registration attempts.
  - Bandwidth consumption and HTTP status codes distributions.
- **Log Source:** `/var/log/nginx/access.log` and `/var/log/nginx/error.log`.
- **Telemetry Collection:** Use Nginx Prometheus Exporter targeting `stub_status` module.

### 3. Database (PostgreSQL)
- **What to Monitor:**
  - Active connections count vs max connections limits.
  - Disk space utilization and buffer cache hit ratios.
  - Slow query executions (queries taking longer than 100ms).
- **Telemetry Collection:** Use `postgres_exporter` and enable `pg_stat_statements` extensions inside Postgres database.

### 4. Memory Cache (Redis)
- **What to Monitor:**
  - Cache memory utilization and eviction rates.
  - Cache hit/miss ratios for rebalance suggestions and market price requests.
  - Connected client counts.
- **Telemetry Collection:** Use `redis_exporter` container.

### 5. Task Worker (Celery & Redis broker)
- **What to Monitor:**
  - Active worker counts, task queue lengths, and queue wait times.
  - Task failure rates and traceback logs for stock quote refreshes.
- **Telemetry Collection:** Integrate **Flower** (real-time celery monitoring dashboard) or use `celery-prometheus-exporter`.

---

## 3. Alerts Configuration & Thresholds

| Metric Alert | Severity | Threshold Trigger | Notification Channel |
| :--- | :---: | :--- | :--- |
| API Error Rate | Critical | `5xx responses > 5%` over 2 minutes | Slack & PagerDuty |
| DB Connections | Warning | `connection_utilization > 80%` | Slack |
| Cache Exhaustion | Critical | `redis_memory_utilization > 90%` | Slack & PagerDuty |
| Disk Storage | Warning | `disk_free_percentage < 15%` | Slack |
| Celery Queue | Warning | `unprocessed_tasks_queue > 50` | Slack |
