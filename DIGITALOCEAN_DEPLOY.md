# DigitalOcean Deployment Guide

## Deploying ResuMatch AI Backend to DigitalOcean App Platform

### Prerequisites

-   DigitalOcean account with $200 credits
-   GitHub repository connected

### Quick Deploy Steps

1. **Go to DigitalOcean Dashboard**

    - Visit: https://cloud.digitalocean.com/apps
    - Click "Create App"

2. **Connect GitHub Repository**

    - Select "GitHub" as source
    - Authorize DigitalOcean
    - Choose repository: `ResuMatch-Ai`
    - Branch: `main`

3. **Configure App**

    - **App Spec**: Upload `.do/app.yaml` or configure manually:
        - Source Directory: `backend`
        - Run Command: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120 --workers 2`
        - HTTP Port: `8080`
        - Health Check Path: `/`

4. **Environment Variables** (Set these in DigitalOcean dashboard)

    ```
    GEMINI_API_KEY = <your-gemini-api-key>
    FLASK_ENV = production
    PORT = 8080
    PYTHON_VERSION = 3.11.0
    ```

    ⚠️ **Important**: Never commit your actual API key to Git!

5. **Choose Plan**

    - Select **Basic** ($5/month)
    - With $200 credits = FREE for 40 months!

6. **Deploy**
    - Click "Create Resources"
    - Wait 3-5 minutes for deployment

### After Deployment

Your backend will be available at:

```
https://resumatch-ai-backend-xxxxx.ondigitalocean.app
```

Update your frontend configuration:

1. Update Vercel environment variable `NEXT_PUBLIC_API_URL`
2. Redeploy frontend

### Benefits

✅ No cold starts - always running
✅ Fast performance
✅ Auto-deploy on push
✅ Health checks enabled
✅ FREE for 40 months with credits

### Cost

-   **Basic Plan**: $5/month
-   **Your Credits**: $200
-   **FREE Duration**: 40 months
