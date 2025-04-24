import { CohereClient } from "cohere-ai";
import { config } from "../config";
import { sanitizeTag } from "./utils";

const cohere = new CohereClient({
  token: config.COHERE_API_KEY,
});

async function getDynamicCategories(purposes: string[]): Promise<string[]> {
  const purposeText = purposes.join(", ");

  const prompt = `
Sen bir yazılım içerikleri danışmanısın.

Aşağıdaki hedeflere yönelik bir teknik blog yazısı oluşturacağız:
👉 ${purposeText}

Bunun için uygun blog kategorilerine ihtiyacımız var.

Kurallar:
- Yukarıdaki konulara uygun güncel, teknik ve yazılımla ilgili kategoriler üret
- En az 3, en fazla 10 kategori öner
- Sadece kategori isimleri olacak şekilde listele (açıklama yazma)
- Her satıra sadece 1 kategori yaz
- Lütfen sadece aşağıdaki gibi sade bir liste ver (örnek):
  mobile devops
  state management
  cross-platform testing

Cevap:
`;

  const response = await cohere.generate({
    model: "command-r-plus",
    prompt,
    maxTokens: 500,
    temperature: 0.7,
  });

  const lines = response.generations[0].text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const cleanedLines = lines
    .map((line) => line.replace(/^[\d\.\-\)\s]+/, "").toLowerCase())
    .filter((line) => /^[a-z0-9\s\-]{3,50}$/.test(line));

  if (cleanedLines.length < 3) {
    console.warn(
      "⚠️ AI'dan gelen kategori sayısı yetersiz, fallback uygulanıyor."
    );
    return ["general development", "web trends", "tech insights"];
  }

  return cleanedLines;
}

async function getTitleForCategory(category: string): Promise<string> {
  const prompt = `Sen bir teknik blog yazarı ve yazılımcısın. '${category}' konusuna özel, dikkat çekici ve SEO uyumlu bir blog başlığı üret. Sadece 1 başlık ver.`;

  const response = await cohere.generate({
    model: "command-r-plus",
    prompt,
    maxTokens: 60,
    temperature: 0.7,
  });

  return response.generations[0].text.trim().replace(/^["'\d\-\.\s]+/, "");
}

async function generateMarkdownPost(title: string): Promise<string> {
  const prompt = `
Aşağıdaki başlığa göre yüksek kaliteli teknik blog yazısı yaz. Kurallar:

- Markdown formatında yaz
- Giriş: En az 2 paragraf, konunun önemi anlatılsın
- En az 3 alt başlık (150+ kelime): Teknik açıklama + örnek
- En az 1 kod örneği (yorumlu, pratik)
- Gerçek dünya senaryosu: Nerede kullanılır?
- Sonuç: Özet ve öğrenilenler
- SEO uyumlu başlık ve kelimeler kullan
- Profesyonel ama sade anlatım

Başlık: "${title}"
  `;

  const response = await cohere.generate({
    model: "command-r-plus",
    prompt,
    maxTokens: 5000,
    temperature: 0.75,
  });

  return response.generations[0].text.trim();
}

async function extractTagsAndSeries(
  markdown: string
): Promise<{ tags: string[]; series: string }> {
  const prompt = `
    Aşağıda bir teknik blog yazısı var. Bu yazıya özel:
    
    - 3 ile 5 arasında lowercase etiket (tags)
    - Uygun bir "serisi" adı
    
    Sadece geçerli bir JSON olarak ver. Örnek biçim:
    {
      "tags": ["javascript", "web", "react"],
      "series": "frontend gelişmeleri"
    }
    
    YAZI:
    ${markdown}
    
    JSON:
    `;

  try {
    const response = await cohere.generate({
      model: "command-r-plus",
      prompt,
      maxTokens: 150,
      temperature: 0.3,
    });

    const text = response.generations?.[0]?.text?.trim();
    if (!text) throw new Error("Boş yanıt geldi.");

    const jsonMatch = text.match(/\{[\s\S]*?\}/)?.[0];
    console.log("🧪 Raw yanıt:", text);
    console.log("🧾 Yakalanan JSON:", jsonMatch);

    if (!jsonMatch) throw new Error("Geçerli JSON bulunamadı.");

    const parsed = JSON.parse(jsonMatch);

    // Validasyon ve Temizleme
    if (!Array.isArray(parsed.tags) || typeof parsed.series !== "string") {
      throw new Error("Beklenen JSON yapısı hatalı.");
    }

    const cleanedTags = parsed.tags
      .map(sanitizeTag)
      .filter(Boolean)
      .slice(0, 4);

    return {
      tags: cleanedTags,
      series: parsed.series,
    };
  } catch (err) {
    console.warn("⚠️ JSON parse hatası:", err);
    return {
      tags: ["yazilim", "gelistirme", "dev"],
      series: "Genel Yazilim",
    };
  }
}

async function createLinkedinPost(markdown: string, postUrl: string) {
  const prompt = `
  Aşağıda bir blog yazısı markdown formatında verilmiştir. Bu yazıya dayanarak, LinkedIn'de paylaşılacak şekilde yüksek kaliteli, profesyonel bir açıklama metni üret.
  
  Paylaşım metni aşağıdaki kurallara göre hazırlanmalı:
  
  🔹 Açılış paragrafı dikkat çekici olmalı. Okuyucunun ilgisini çeken bir cümleyle yazıya giriş yapılmalı. 🚀, 📢, 🔍 gibi emojiler kullanılabilir.
  
  🔹 Yazının konusu net bir şekilde açıklanmalı. Konunun neden önemli olduğu sade bir dille anlatılmalı. Teknik terimler varsa, basitleştirilmiş bir anlatım tercih edilmeli.
  
  🔹 En az 2 ayrı paragraf kullanılmalı. Her paragraf ayrı bir fikir veya başlık taşımalı. Metin bölümlenmiş ve okunabilir olmalı.
  
  🔹 Eğer içerikte maddeler varsa, her maddeye 🟠, ✅, 🔸 gibi emojiler eklenerek yazılmalı.
  
  🔹 Paylaşım sonunda aşağıdaki satırla yazıya yönlendirme yapılmalı:
  👉 Yazının tamamı için: ${postUrl}
  
  🔹 En son satırda en fazla 10 adet teknoloji ve yazılım odaklı, alakalı hashtag kullanılmalı (örn: #Token #API #Güvenlik #WebGeliştirme #SoftwareDevelopment #Tech).
  
  Blog içeriği aşağıda yer almaktadır:
  
  ${markdown}
  `;

  const response = await cohere.generate({
    model: "command-r-plus",
    prompt,
    maxTokens: 3000,
    temperature: 0.6,
  });

  const message = `${response.generations[0].text.trim()}`;

  return message;
}

export {
  getDynamicCategories,
  getTitleForCategory,
  generateMarkdownPost,
  extractTagsAndSeries,
  createLinkedinPost,
};
