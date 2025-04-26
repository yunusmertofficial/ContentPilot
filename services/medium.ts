import { setTimeout } from "node:timers/promises";
import puppeteer, { Browser, Page } from "puppeteer";
import fs from "fs";

const cookiesPath = "./cookies.json";

export async function publishToMedium(
  title: string,
  tags: string[],
  series: string,
  apiUrl: string,
  callback: (url: string) => void
) {
  const browser: Browser = await puppeteer.launch({
    headless: false,
    slowMo: 20,
  });

  const page: Page = await browser.newPage();

  const pages = await browser.pages();
  if (pages.length > 0) {
    await pages[0].close(); // İlk sekmeyi (boş sekmeyi) kapat
  }

  await loadCookies(page);

  await page.goto("https://medium.com/", { waitUntil: "networkidle2" });

  if (await isLoggedIn(page)) {
    console.log("Zaten giriş yapıldı! 🚀");
    const url = await startPosting(page, title, apiUrl);
    await browser.close();
    callback(url);
  } else {
    process.stdin.once("data", async () => {
      await saveCookies(page);
      console.log("Cookie kaydedildi! ✅ Şimdi yazı oluşturuyoruz...");
      const url = await startPosting(page, title, apiUrl);
      callback(url);
      await browser.close();
    });
  }
}

async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('a[href*="/new-story"]', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function startPosting(page: Page, title: string, apiUrl: string) {
  console.log("Yeni yazı oluşturuluyor... 📝");

  // Yeni bir sekme açıp apiUrl'ye git
  const contentPage = await page.browser().newPage();
  await contentPage.goto(apiUrl, { waitUntil: "networkidle2" });

  // Sayfanın içine tıklayıp Ctrl+A, Ctrl+C yap
  await contentPage.keyboard.down("Control");
  await contentPage.keyboard.press("KeyA");
  await contentPage.keyboard.press("KeyC");
  await contentPage.keyboard.up("Control");

  console.log("İçerik kopyalandı!");

  // Kopyaladıktan sonra content sekmesini kapat
  await contentPage.close();

  // Medium yeni hikaye sayfasına git
  await page.goto("https://medium.com/new-story", {
    waitUntil: "networkidle2",
  });

  await page.waitForSelector('article div[role="textbox"]');
  await page.click('article div[role="textbox"]');

  // Başlığı yaz
  await page.keyboard.type(title);
  await page.keyboard.press("Tab");

  // Yapıştır (Ctrl+V)
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyV");
  await page.keyboard.up("Control");

  console.log("İçerik Medium editörüne yapıştırıldı!");

  await setTimeout(3000);

  // 🔥 Klavye olaylarını tamamen bitirdik, şimdi mouse ile boş bir yere tıklıyoruz
  await page.mouse.click(300, 300); // Ekranın üst taraflarında bir yere (güvenli)

  // 🔥 3 saniye bekle (sayfanın kaydetmesini bekliyoruz)
  await setTimeout(3000);

  await page.click('button[data-action="show-prepublish"]');
  await page.waitForSelector('button[data-action="show-prepublish"]', {
    timeout: 5000,
  });
  //ekranda bir kere tıkla

  await page.click('button[data-action="publish"]');

  console.log("Yazı yayınlandı! 🎉");
  await setTimeout(3000);

  // 🔥 BURASI: Yayınlanan yazının URL'sini al
  const publishedUrl = page.url();

  await setTimeout(3000);
  await page.close();
  return publishedUrl;
}

// Login işlemleri
async function saveCookies(page: Page) {
  const cookies = await page.cookies();
  console.log("Cookie'ler kaydedildi:", cookies);
  fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
}

async function loadCookies(page: Page) {
  if (fs.existsSync(cookiesPath)) {
    const cookiesString = fs.readFileSync(cookiesPath, "utf-8");
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
  }
}
