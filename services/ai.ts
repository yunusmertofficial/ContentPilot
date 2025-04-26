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
  
  Aşağıdaki hedeflere yönelik teknik blog yazıları oluşturacağız:
  👉 ${purposeText}
  
  Bunun için blog kategorileri üret.
  
  Kurallar:
  - Yalnızca kategori isimlerini üret.
  - Her satıra sadece bir kategori ismi yaz (ne açıklama, ne giriş cümlesi, sadece isim).
  - Hiçbir açıklama, selamlaşma, giriş veya kapanış cümlesi yazma.
  - İlk satırdan itibaren doğrudan kategori isimlerini listele.
  - Numara, tire (-) veya başka işaret kullanma.
  - En az 3, en fazla 10 kategori üret.
  
  Örnek:
  mobile devops
  state management
  cross-platform testing
  
  Sadece bu formatta çıktı ver.
  
  Başla:
  `;

  const response = await cohere.generate({
    model: "command-r-plus",
    prompt,
    maxTokens: 500,
    temperature: 0.7,
  });

  const rawText = response.generations[0].text;
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  console.log("🧪 AI'dan gelen ham liste:", lines, rawText);

  // 1. Adım: "Elbette", "İşte", "Şunlar:" gibi cümleleri komple at
  const onlyCategoryLines = lines.filter(
    (line) => !/^elbet|^işte|^bunlar|^kategoriler|^listesi|:$/i.test(line)
  );

  // 2. Adım: Başında - veya numara olanları temizle
  const cleanedLines = onlyCategoryLines
    .map((line) =>
      line
        .replace(/^[\d\.\-\)\s]+/, "")
        .toLowerCase()
        .trim()
    )
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
  const prompt = `Sen deneyimli bir teknik blog yazarı ve yazılımcısın. '${category}' konusunda EN FAZLA 10 kelimelik, dikkat çekici, profesyonel, SEO uyumlu bir blog başlığı üret.

- Başlık sade, akıcı ve merak uyandırıcı olsun.
- Sadece 1 başlık üret, açıklama yapma.
- Başlıkta emoji kullanma.
- Başlıkta dolgu veya boş kelimeler kullanma (örneğin: "harika", "inanılmaz" gibi kelimelerden kaçın).
- Başlıkta ":", "-", gibi iki bölümlü yapı kullanma; sadece doğal bir ifade olsun.
- Başlık değer vaadi hissettirsin, clickbait yapma.
- Türkçe üret.
  `;

  const response = await cohere.generate({
    model: "command-r-plus",
    prompt,
    maxTokens: 60,
    temperature: 0.7,
  });

  return response.generations[0].text
    .trim()
    .replace(/^["'\d\-\.\s]+|["'\s]+$/g, "");
}

async function generateMarkdownPost(title: string): Promise<string> {
  const prompt = `
Aşağıdaki başlığa göre yüksek kaliteli teknik blog yazısı yaz. Kurallar:

- Başlık zaten verildi. İçeriğe başlık EKLEME. İçerik SADECE giriş paragrafıyla başlamalı.
- Markdown formatında yaz
- Giriş: En az 2 paragraf, konunun önemi anlatılsın
- En az 3 alt başlık (150+ kelime): Teknik açıklama + örnek
- En az 1 kod örneği (yorumlu, pratik)
- Gerçek dünya senaryosu: Nerede kullanılır?
- Sonuç: Özet ve öğrenilenler
- SEO uyumlu başlık ve kelimeler kullan
- Profesyonel ama sade anlatım

## ❌ YANLIŞ ÖRNEK
## Tatil Anılarım
Yaz tatilinde deniz kenarına gittik...

(Başlık zaten verildiyse, içerikte tekrar başlık kullanmak YANLIŞTIR.)

## ✅ DOĞRU ÖRNEK
Yaz tatili birçok kişi için...

(İçerik sadece giriş paragrafıyla başlar, başlık içermez.)


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

async function createLinkedinPost(
  markdown: string,
  postUrl: string,
  tags: string[],
  title: string,
  series?: string
) {
  const formattedTags = tags.map((tag) => `#${tag}`).join(" ");

  const seriesNote = series
    ? `\n🧩 Not: Bu gönderi "${series}" adlı serinin bir parçasıdır.\n`
    : "";

  const prompt = `
Aşağıda bir blog yazısı markdown formatında verilmiştir. Bu yazıya dayanarak, LinkedIn'de paylaşılmak üzere dikkat çekici ve profesyonel bir açıklama metni üret.

📌 Hedef: Kullanıcının ilgisini çekmek ve onu blog yazısına tıklamaya teşvik etmek.

Metin şu kurallara uygun olmalı:

🔹 Açılış paragrafı dikkat çekici ve çarpıcı olmalı. 🚀, 📢, 🔍 gibi emojilerle desteklenebilir.  
🔹 Konu kısa, sade ve etkili biçimde özetlenmeli. Gereksiz detaylardan kaçınılmalı.  
🔹 Yazı maksimum 2 paragraftan oluşmalı. Görsel olarak boşluklu ve okunabilir olmalı.  
🔹 Liste içerik varsa 🟠, ✅, 🔸 gibi emojilerle yazılmalı.  
🔹 Sonunda mutlaka bu satır yer almalı:
👉 Yazının tamamı için: ${postUrl}  
${seriesNote}
🔹 **Aşağıdaki etiketleri LinkedIn postunun sonuna hashtag olarak ekle:**  
${formattedTags}

Blog başlığı: ${title}

Blog içeriği:

${markdown}
`;

  const response = await cohere.generate({
    model: "command-r-plus",
    prompt,
    maxTokens: 3000,
    temperature: 0.6,
  });

  const message = response.generations[0].text.trim();
  return message;
}

export {
  getDynamicCategories,
  getTitleForCategory,
  generateMarkdownPost,
  extractTagsAndSeries,
  createLinkedinPost,
};
