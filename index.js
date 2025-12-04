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
        console.log('Navigating to PSX...');

        await page.goto('https://dps.psx.com.pk/', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        console.log('Waiting for dropdowns...');
        await page.waitForSelector('select', { timeout: 10000 });

        console.log('Selecting KSE100...');
        // Select KSE100 from the INDEX dropdown (second select)
        const selects = await page.$$('select');
        if (selects.length >= 2) {
            await selects[1].select('KSE100'); // INDEX dropdown
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Selecting All entries...');
        // Select "All" from the Show entries dropdown (first select)
        if (selects.length >= 1) {
            await selects[0].select('-1'); // -1 typically means "All"
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Extracting stock data...');
        // Extract stock data from the table
        const stocks = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table tbody tr'));

            return rows.map(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 7) return null;

                // Column 0: SYMBOL
                const symbol = cells[0]?.textContent?.trim() || '';

                // Column 6: CURRENT (not CHANGE %)
                const priceText = cells[6]?.textContent?.trim() || '0';
                const price = parseFloat(priceText.replace(/,/g, ''));

                if (!symbol || isNaN(price) || price === 0) return null;

                return { symbol, price };
            }).filter(stock => stock !== null);
        });

        console.log(`Scraped ${stocks.length} stocks from PSX`);

        // Get company names from the symbols endpoint
        const symbolsResponse = await fetch('https://dps.psx.com.pk/symbols');
        const symbolsData = await symbolsResponse.json();

        // Map symbols to names
        const symbolMap = {};
        symbolsData.forEach(item => {
            symbolMap[item.symbol] = item.name;
        });

        // Combine price data with names
        const enrichedStocks = stocks.map(stock => ({
            symbol: stock.symbol,
            name: symbolMap[stock.symbol] || stock.symbol,
            price: stock.price
        }));

        res.json({
            success: true,
            count: enrichedStocks.length,
            stocks: enrichedStocks,
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
