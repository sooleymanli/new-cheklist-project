# DevOps Architecture

# Facility Inspection & Incident Management Platform

Version: 1.0

Architecture Type:

* Containerized Micro-Module Monolith Deployment
* Docker Compose Based Infrastructure
* Nginx Reverse Proxy
* CI/CD Pipeline Ready
* Production Scalable Setup

---

# 1. High-Level Infrastructure Overview

System consists of:

* Frontend (React 19)
* Backend (NestJS Monolith Modular)
* PostgreSQL (Primary Database)
* Redis (Cache + Queue + Socket support)
* MinIO (File Storage)
* Nginx (Reverse Proxy + SSL Termination)

---

# 2. System Architecture Diagram (Logical)

```text id="infra1"
                ┌──────────────┐
                │   Internet   │
                └──────┬───────┘
                       │
                ┌──────▼───────┐
                │    Nginx     │
                │ Reverse Proxy│
                └───┬────┬──────┘
        ┌───────────┘    └───────────┐
        │                            │
┌───────▼────────┐        ┌─────────▼────────┐
│   Frontend     │        │     Backend      │
│ React 19 (SPA) │        │ NestJS API      │
└────────────────┘        └─────────┬────────┘
                                    │
        ┌──────────────┬────────────┴─────────────┐
        │              │                          │
┌───────▼──────┐ ┌────▼─────┐             ┌──────▼──────┐
│ PostgreSQL   │ │ Redis    │             │   MinIO     │
│ Database     │ │ Cache +  │             │ File Store  │
│              │ │ Queue    │             │             │
└──────────────┘ └──────────┘             └─────────────┘
```

---

# 3. Docker Compose Architecture

## Services

* frontend
* backend
* postgres
* redis
* minio
* nginx

---

## docker-compose.yml

```yaml id="dc1"
version: "3.9"

services:

  frontend:
    build: ./frontend
    container_name: frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - backend

  backend:
    build: ./backend
    container_name: backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app
      - REDIS_URL=redis://redis:6379
      - MINIO_ENDPOINT=minio
    depends_on:
      - postgres
      - redis
      - minio

  postgres:
    image: postgres:16
    container_name: postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    container_name: redis
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    container_name: minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

  nginx:
    image: nginx:latest
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - frontend
      - backend

volumes:
  pg_data:
  minio_data:
```

---

# 4. Nginx Configuration

## Reverse Proxy Setup

```nginx id="ng1"
server {
    listen 80;

    server_name app.local;

    location / {
        proxy_pass http://frontend:3000;
    }

    location /api/ {
        proxy_pass http://backend:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io/ {
        proxy_pass http://backend:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

# 5. Environment Strategy

## Backend (.env)

```env id="env1"
NODE_ENV=production
PORT=5000

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app
REDIS_URL=redis://redis:6379

JWT_SECRET=supersecret
JWT_REFRESH_SECRET=refreshsecret

MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

---

## Frontend (.env)

```env id="env2"
VITE_API_URL=http://localhost/api
VITE_SOCKET_URL=http://localhost
```

---

# 6. CI/CD Pipeline (GitHub Actions)

## Pipeline Overview

* Install dependencies
* Run tests
* Build Docker images
* Push to registry
* Deploy server

---

## GitHub Actions Workflow

```yaml id="ci1"
name: CI/CD Pipeline

on:
  push:
    branches:
      - main

jobs:
  build:

    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install dependencies (Backend)
        run: |
          cd backend
          npm install

      - name: Run Tests
        run: |
          cd backend
          npm run test

      - name: Build Docker Images
        run: |
          docker compose build

      - name: Deploy
        run: |
          echo "Deploy step placeholder (SSH / Kubernetes)"
```

---

# 7. Deployment Strategy

## Production Flow

```text id="deploy1"
Git Push → CI Pipeline → Build Docker Images → Test → Deploy Server → Restart Services
```

---

## Deployment Methods

### Option 1: VPS (Recommended)

* Docker Compose on Ubuntu Server
* Nginx reverse proxy
* SSL via Certbot

---

### Option 2: Kubernetes (Future Scale)

* Backend pods
* Frontend pods
* Managed DB (optional)

---

# 8. Database Strategy (PostgreSQL)

## Optimization

* Indexed foreign keys
* JSONB usage for dynamic checklist fields
* Connection pooling (PgBouncer optional)

---

## Backup Strategy

```text id="backup1"
Daily backup → S3 / MinIO bucket
Weekly full snapshot
Retention: 30 days
```

---

# 9. Redis Usage Strategy

Redis is used for:

* Socket session management
* Queue system (BullMQ)
* Notification caching
* Rate limiting
* Temporary QR session validation

---

# 10. MinIO File Storage Strategy

## Buckets

* checklist-files
* incident-images
* user-avatars
* qr-assets

---

## Access Strategy

* Signed URLs
* Expiry-based access control
* No direct public access

---

# 11. Security Layer (DevOps Level)

* Nginx rate limiting
* HTTPS enforcement
* Firewall (UFW recommended)
* Container isolation
* Environment variable protection
* No secrets in image builds

---

# 12. Logging Strategy

## Backend Logs

* Pino logger
* File + console logs

## Infrastructure Logs

* Docker logs
* Nginx access logs
* Error logs centralized (future ELK stack)

---

# 13. Scaling Strategy

## Horizontal Scaling Ready

* Backend stateless design
* Redis shared state
* Load balancer via Nginx
* Multiple backend replicas possible

---

# 14. Health Checks

Endpoints:

```http id="health1"
GET /health
GET /ready
```

---

# 15. Summary

This DevOps architecture provides:

* Fully containerized system
* Production-ready deployment flow
* Scalable backend design
* Secure file storage (MinIO)
* High-performance caching (Redis)
* Reverse proxy with Nginx
* CI/CD automation ready

---

# End of DevOps Architecture
