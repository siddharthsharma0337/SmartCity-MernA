# Backend Deployment Guide for Render

This guide provides step-by-step instructions to deploy the Smart Waste Management Backend and PostgreSQL database on [Render](https://render.com).

---

## Method 1: Deploy using Render Blueprint (Recommended - One Click)

1. Push your project repository to GitHub / GitLab.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically detect `render.yaml` and provision:
   - A **PostgreSQL Database** (`smart-waste-db`)
   - A **Web Service** (`smart-waste-backend`) running on Node.js
   - Automatically link the database connection string (`DATABASE_URL`) to your backend.
6. Click **Apply**.
7. Once deployed, test your API at `https://<your-service-name>.onrender.com/health`.

---

## Method 2: Manual Step-by-Step Deployment on Render

### Step 1: Create a PostgreSQL Database on Render
1. In Render Dashboard, click **New +** -> **PostgreSQL**.
2. Name it (e.g., `smart-waste-db`).
3. Select Region and Free Tier plan.
4. Click **Create Database**.
5. Once created, copy the **Internal Database URL** (or External Database URL if deploying outside Render).

### Step 2: Deploy the Backend Web Service
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your repository.
3. Configure the following fields:
   - **Name**: `smart-waste-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run migrate && npm start`
4. Expand **Advanced** and add the following **Environment Variables**:
   | Key | Value / Source |
   |-----|----------------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(Paste your Render PostgreSQL connection string)* |
   | `JWT_SECRET` | *(Enter a secure random string, e.g. 64 characters)* |
   | `PORT` | `3000` *(or let Render set it automatically)* |
   | `REDIS_URL` | *(Optional: Upstash Redis URL or redis://localhost:6379)* |
5. Set **Health Check Path** to `/health`.
6. Click **Create Web Service**.

### Step 3: Run Database Migrations
Because the start command is configured as `npm run migrate && npm start`, database tables from `src/db/schema.sql` are automatically created on first boot.

Alternatively, you can manually run migrations via the **Render Shell** tab:
```bash
npm run migrate
```

---

## Testing Your Deployed Backend

### 1. Health Check
```bash
curl https://<your-service-name>.onrender.com/health
```
Response:
```json
{"status":"ok","service":"smart-waste-backend"}
```

### 2. Register a New User (`POST /auth/register`)
```bash
curl -X POST https://<your-service-name>.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex City Admin",
    "email": "alex@city.gov",
    "password": "Password123!",
    "role": "admin",
    "phone": "555-0199"
  }'
```
Response (201 Created):
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "name": "Alex City Admin",
    "email": "alex@city.gov",
    "phone": "555-0199",
    "role": "admin",
    "status": "active",
    "created_at": "2026-08-19T..."
  }
}
```

### 3. Login (`POST /auth/login`)
```bash
curl -X POST https://<your-service-name>.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@city.gov",
    "password": "Password123!"
  }'
```

---

## Connecting Frontend to Deployed Backend

In your frontend project or deployment (e.g. Vercel, Netlify, or Render Static Site):
Set the environment variable:
```env
VITE_API_BASE=https://<your-service-name>.onrender.com
```
