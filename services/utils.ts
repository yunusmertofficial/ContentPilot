export async function retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      console.warn(`⚠️ Hata (deneme ${i + 1}/${retries}):`, err.message || err);
    }
  }
  console.error("❌ 3 denemede başarısız:", lastError);
  throw lastError;
}

export function sanitizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .replace(/[^a-z0-9]/g, ""); // sadece harf ve rakam
}
