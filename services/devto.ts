import axios from "axios";
import { config } from "../config";

export async function publishToDevto(
  title: string,
  markdown: string,
  tags: string[],
  series: string
) {
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
