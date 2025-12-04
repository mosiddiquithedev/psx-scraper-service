# PSX Scraper Service

A standalone service that scrapes KSE100 stock data from Pakistan Stock Exchange using Puppeteer.

## Deployment on Render.com (FREE)

1. **Push to GitHub**:
   ```bash
   cd psx-scraper-service
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/psx-scraper-service.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [https://render.com](https://render.com)
   - Sign up / Log in
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `psx-scraper-service`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: `Free`
   - Click "Create Web Service"

3. **Get Your Service URL**:
   - After deployment, you'll get a URL like: `https://psx-scraper-service.onrender.com`
   - Test it: `https://psx-scraper-service.onrender.com/api/scrape-kse100`

4. **Update Your Vercel App**:
   - Add environment variable in Vercel:
     ```
     SCRAPER_SERVICE_URL=https://psx-scraper-service.onrender.com
     ```
   - Update the sync-stocks API to call this service

## Local Testing

```bash
npm install
npm start
```

Visit: http://localhost:3001/api/scrape-kse100

## API Endpoints

- `GET /` - Health check
- `GET /api/scrape-kse100` - Scrape KSE100 stocks

## Response Format

```json
{
  "success": true,
  "count": 100,
  "stocks": [
    {
      "symbol": "OGDC",
      "name": "Oil & Gas Development Company Limited",
      "price": 123.45
    }
  ],
  "timestamp": "2024-12-04T16:00:00.000Z"
}
```

## Notes

- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- 750 hours/month free (enough for this use case)
