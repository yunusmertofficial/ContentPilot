import {
  createLinkedinPost,
  generateMarkdownPost,
  getDynamicCategories,
  getTitleForCategory,
} from "./ai";
import { publishToDevto } from "./devto";
import { sharePostOnLinkedIn } from "./linkedin";
import { retry } from "./utils";

export async function dailyContentBlast(purposes: string[]) {
  try {
    console.log("📚 Kategoriler alınıyor...");
    const categories = await retry(() => getDynamicCategories(purposes));

    const category = categories[Math.floor(Math.random() * categories.length)];
    console.log("🎯 Seçilen kategori:", category);

    const title = await retry(() => getTitleForCategory(category));
    console.log("📝 Başlık:", title);

    const markdown = await retry(() => generateMarkdownPost(title));
    console.log("✍️ Yazı oluşturuldu, yayınlanıyor...");

    const devToUrl = await retry(() => publishToDevto(title, markdown));

    const linkedinText = await retry(() =>
      createLinkedinPost(markdown, devToUrl)
    );
    console.log("🔗 LinkedIn paylaşım metni oluşturuldu.");

    const linkedinResponse = await retry(() =>
      sharePostOnLinkedIn(linkedinText)
    );
    console.log("🔗 LinkedIn paylaşım yapıldı:", linkedinResponse);
  } catch (err) {
    console.error("🚨 Sistem durdu:", err);
  }
}
