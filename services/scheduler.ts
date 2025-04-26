import {
  createLinkedinPost,
  extractTagsAndSeries,
  generateHtmlPost,
  getDynamicCategories,
  getTitleForCategory,
} from "./ai";
import { sharePostOnLinkedIn } from "./linkedin";
import { publishToMedium } from "./medium";
import { sendEmail } from "./sendEmail";
import { retry, saveToFile } from "./utils";

export async function dailyContentBlast(purposes: string[]) {
  try {
    console.log("📚 Kategoriler alınıyor...");
    const categories = await retry(() => getDynamicCategories(purposes));

    const category = categories[Math.floor(Math.random() * categories.length)];
    console.log("🎯 Seçilen kategori:", category);

    const title = await retry(() => getTitleForCategory(category));
    console.log("📝 Başlık:", title);

    const html = await generateHtmlPost(title);
    console.log("✍️ Yazı oluşturuldu, yayınlanıyor...");
    const { tags, series } = await retry(() => extractTagsAndSeries(html));
    console.log("🏷️ Etiketler:", tags);
    const savedName = saveToFile("uploads", "articles", title, html);
    console.log("💾 Yazı kaydedildi:", savedName);
    const apiUrl = `http://localhost:3000/articles/${savedName}`;
    await publishToMedium(title, tags, series, apiUrl, async (url) => {
      try {
        const linkedinText = await retry(() =>
          createLinkedinPost(html, url, tags, title, series)
        );

        const linkedinResponse = await sharePostOnLinkedIn(linkedinText);
        await sendEmail(
          `✅ Yeni İçerik Yayınlandı: ${title}`,
          `Yeni yazı başarıyla yayınlandı.\n\n` +
            `📅 Yayınlanma Tarihi: ${new Date().toLocaleString("tr-TR")}\n` +
            `📝 Başlık: ${title}\n` +
            `🔗 Dev.to Linki: ${url}\n` +
            // `🔗 Medium Linki: ${mediumUrl}\n` +
            `📣 LinkedIn Durumu: ${linkedinResponse.id}`
        );
      } catch (err) {
        let errorMessage = "";
        if (err instanceof Error) {
          errorMessage = `Hata yeri:\n${err.stack}`;
          errorMessage += `\n\nHata mesajı:\n${err.message}`;
        } else {
          errorMessage = `Hata mesajı (tipi tanımsız):\n${JSON.stringify(err)}`;
        }

        await sendEmail(
          `🚨 Hata! Post Paylaşılamadı ${new Date().toLocaleString("tr-TR")}`,
          `Hata mesajı:\n${errorMessage}`
        );
      }
    });
  } catch (err) {
    console.error("🚨 Sistem durdu:", err);

    let errorMessage = "";
    if (err instanceof Error) {
      errorMessage = `Hata yeri:\n${err.stack}`;
      errorMessage += `\n\nHata mesajı:\n${err.message}`;
    } else {
      errorMessage = `Hata mesajı (tipi tanımsız):\n${JSON.stringify(err)}`;
    }

    await sendEmail(
      `🚨 Hata! Post Paylaşılamadı ${new Date().toLocaleString("tr-TR")}`,
      `Hata mesajı:\n${errorMessage}`
    );
  }
}
