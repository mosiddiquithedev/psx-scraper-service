const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'PSX Scraper Service Running', version: '1.0.0' });
});

// Scrape KSE100 stocks
app.get('/api/scrape-kse100', async (req, res) => {
    let browser;

    try {
        console.log('Starting browser...');
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: true,
        });

        const page = await browser.newPage();
        console.log('Navigating to Sarmaaya...');

        await page.goto('https://sarmaaya.pk/stocks?indice=KSE100&limit=250', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        console.log('Waiting for table...');
        await page.waitForSelector('table', { timeout: 15000 });

        // Wait a bit more for data to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Extracting stock data...');
        // Extract stock data from the table
        const stocks = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table tbody tr'));

            return rows.map(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 2) return null;

                // First column contains symbol (div) and name (p)
                const firstCell = cells[0];
                const symbol = firstCell.querySelector('div')?.textContent?.trim() || '';
                const name = firstCell.querySelector('p')?.textContent?.trim() || '';

                // Second column "Curr." contains current price
                const priceText = cells[1]?.textContent?.trim() || '0';
                const price = parseFloat(priceText.replace(/,/g, ''));

                if (!symbol || !name || isNaN(price) || price === 0) return null;

                return { symbol, name, price };
            }).filter(stock => stock !== null);
        });

        console.log(`Scraped ${stocks.length} stocks from Sarmaaya`);

        res.json({
            success: true,
            count: stocks.length,
            stocks: stocks,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`PSX Scraper Service running on port ${PORT}`);
});
