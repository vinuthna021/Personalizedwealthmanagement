# Cloud Deployment Options Guide

This guide details three cloud architecture options for hosting the Personalized Wealth Management application, ranging from serverless managed services to full virtual machines.

---

## Option A: Managed Serverless & Platform-as-a-Service (PaaS)
*Ideal for low-overhead, modular hosting, and automatic scaling.*

- **Stack Mapping:**
  - Frontend: **Vercel**
  - Backend API & Celery Worker: **Render** (API + Web Service + Background Worker)
  - Database: **Neon** (Serverless PostgreSQL)
  - Cache & Celery Broker: **Upstash** (Serverless Redis)
- **Difficulty Level:** Easy / Medium
- **Cost Estimate:** **$14 - $30 / month**
  - Vercel: Free Tier
  - Render API Service: $7/month (Starter tier to prevent spin-down/cold-starts)
  - Render Celery Worker: $7/month (Starter tier)
  - Neon Postgres: Free Tier / $5/month (based on storage/compute hours)
  - Upstash Redis: Free Tier / Pay-As-You-Go
- **Deployment Steps:**
  1. Set up a serverless PostgreSQL instance on Neon, copy the connection URI.
  2. Set up a serverless Redis database on Upstash, copy the connection URI.
  3. Deploy the frontend React app to Vercel by importing the GitHub repository. Define `VITE_API_URL` pointing to the Render backend service url.
  4. Create a Web Service on Render targeting the `./backend` directory, using `gunicorn app.main:app -k uvicorn.workers.UvicornWorker` as start command. Bind `DATABASE_URL` (Neon) and `REDIS_URL` (Upstash) in environment.
  5. Create a Background Worker on Render for Celery, using command `celery -A app.celery_app.celery_app worker -B --loglevel=info`.
- **Scalability Notes:**
  - Database and Cache auto-scale dynamically. Render supports auto-scaling instances for backend web processes.

---

## Option B: Single Ubuntu Virtual Machine (VM)
*Ideal for self-contained, budget-friendly hosting utilizing Docker Compose.*

- **Stack Mapping:**
  - Host: **DigitalOcean Droplet / Hetzner Cloud VM / Linode** (Ubuntu 22.04 LTS)
  - Architecture: Complete Docker Compose stack (api, db, redis, celery, nginx) running directly on the VM.
- **Difficulty Level:** Medium
- **Cost Estimate:** **$10 - $20 / month**
  - Single VM (2 vCPU, 4GB RAM) is sufficient for initial traction.
- **Deployment Steps:**
  1. SSH into the Ubuntu VM. Install Docker and Docker Compose.
  2. Clone the Git repository.
  3. Copy `backend/.env.production` to `backend/.env` and update secrets (database password, JWT secrets).
  4. Build and run the containers: `docker compose build && docker compose up -d`.
  5. Apply database migrations: `docker exec wealth_api alembic upgrade head`.
  6. Point your domain DNS records to the VM's public IP address. Nginx will automatically handle reverse proxying on ports 80/443.
- **Scalability Notes:**
  - Vertically scales by resizing the VM instances. Horizontal scaling requires moving the database and redis elements out of the VM to dedicated external managed clusters.

---

## Option C: AWS Enterprise Stack (EC2 + ECS + RDS + ElastiCache)
*Ideal for high-availability, enterprise-grade scalability, and strict compliance.*

- **Stack Mapping:**
  - Orchestration: **AWS ECS** (Fargate / EC2 launch types)
  - Database: **AWS RDS** (Multi-AZ PostgreSQL)
  - Cache: **AWS ElastiCache** (Redis OSS)
  - Static files: **AWS S3 + CloudFront CDN**
- **Difficulty Level:** Hard
- **Cost Estimate:** **$100 - $180 / month**
  - RDS Postgres (db.t3.micro Multi-AZ): ~$30/month
  - ElastiCache Redis (cache.t3.micro): ~$15/month
  - ECS Fargate tasks: ~$40/month
  - Application Load Balancer (ALB): ~$22/month
- **Deployment Steps:**
  1. Spin up an AWS RDS PostgreSQL instance in private subnets.
  2. Spin up an AWS ElastiCache Redis instance in private subnets.
  3. Create an ECR registry. Build and push the backend/celery images to ECR.
  4. Set up an ECS Fargate Cluster. Create Task Definitions for API-server and Celery, passing connection parameters securely via AWS Secrets Manager.
  5. Deploy the React SPA build to an S3 Bucket, configure CloudFront CDN to serve static assets, and configure DNS routing in Route 53.
  6. Set up an Application Load Balancer (ALB) to route requests for `/api/*` to the ECS Fargate target groups.
- **Scalability Notes:**
  - Fully distributed architecture with zero single points of failure. ECS auto-scaling scales task containers horizontally based on CPU/Memory utilization.
