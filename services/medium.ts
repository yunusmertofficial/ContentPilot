//TODO: Medium'da topics kısmına da ilişkili 5 adet topic eklenmeli Nice2Have
//TODO: Medium linki alınıp döndürülmeli

import { setTimeout } from "node:timers/promises";
import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';

const cookiesPath = './cookies.json';

export async function publishToMedium(title: string, content: string, tags: string[], series: string) {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    slowMo: 20
  });

  const page: Page = await browser.newPage();

  const pages = await browser.pages();
  if (pages.length > 0) {
    await pages[0].close(); // İlk sekmeyi (boş sekmeyi) kapat
  }

  await loadCookies(page);

  await page.goto('https://medium.com/', { waitUntil: 'networkidle2' });

  if (await isLoggedIn(page)) {
    console.log('Zaten giriş yapıldı! 🚀');
    await startPosting(page, title, content);
  } else {
    console.log('Giriş yapılmadı, lütfen giriş yap ve Enter\'a bas.');
    
    process.stdin.once('data', async () => {
      await saveCookies(page);
      console.log('Cookie kaydedildi! ✅ Şimdi yazı oluşturuyoruz...');
      await startPosting(page, title, content);
    });
  }

  await browser.close();
}

async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('a[href*="/new-story"]', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function startPosting(page: Page, title: string, content: string) {
  await page.goto('https://medium.com/new-story', { waitUntil: 'networkidle2' });

  await page.waitForSelector('article div[role="textbox"]');
  await page.click('article div[role="textbox"]');
  await page.keyboard.type(title);

  await page.keyboard.press('Tab');
  await page.keyboard.type(content);

  await setTimeout(3000);

  await page.click('button[data-action="show-prepublish"]');
  await page.waitForSelector('button[data-action="show-prepublish"]', { timeout: 5000 });
  await page.click('button[data-action="publish"]');

  console.log('Yazı yayınlandı! 🎉');

  await setTimeout(3000);
  await page.close(); // Sekmeyi kapat

}

//Login işlemlerini otomatikleştirme kısmı
async function saveCookies(page: Page) {
  const cookies = await page.cookies();
  fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
}

async function loadCookies(page: Page) {
  const cookiesString = fs.readFileSync(cookiesPath, 'utf-8');
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
  }
}