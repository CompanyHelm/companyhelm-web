import { chromium } from 'playwright';

const companyId = '676d1052-2415-41ca-86f6-4ca70b4b37e6';
const agentId = 'd1ed75b3-d324-4c8b-a290-3307100aa9d1';
const sessionId = '7af888a5-7fcb-4202-9af0-c435cf512eac';
const url = `http://127.0.0.1:5173/agents/${agentId}/chats/${sessionId}`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
await page.addInitScript(([key, value]) => localStorage.setItem(key, value), ['companyhelm.selectedCompanyId', companyId]);
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.locator('text=Runner MCP servers configured for this agent').first().waitFor({ timeout: 20000 });
await page.screenshot({ path: '/workspace/frontend/context7-available.png', fullPage: true });
await browser.close();
console.log('saved /workspace/frontend/context7-available.png');
