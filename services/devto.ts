import axios from "axios";
import { retry } from "./utils";
import { config } from "../config";
import { extractTagsAndSeries } from "./ai";

export async function publishToDevto(title: string, markdown: string) {
  const { tags, series } = await retry(() => extractTagsAndSeries(markdown));
  console.log("🏷️ Etiketler:", tags);
  console.log("📚 Seri:", series);
  const payload = {
    article: {
      title,
      published: true,
      body_markdown: markdown,
      tags,
      series,
    },
  };

  const res = await axios.post("https://dev.to/api/articles", payload, {
    headers: {
      "api-key": config.DEVTO_API_KEY,
      "Content-Type": "application/json",
    },
  });

  return res.data.url;
}
