import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { dailyContentBlast } from "./services/scheduler";

// Express App başlat
const app = express();
const PORT: number = process.env.PORT ? Number(process.env.PORT) : 3000;

// Uploads/articles klasörünü tanımla
const articlesDir: string = path.join(__dirname, "uploads", "articles");

// Route: İstediğin makaleyi HTML olarak göster
app.get("/articles/:name", (req: Request, res: Response) => {
  const articleName: string = req.params.name;
  const filePath: string = path.join(articlesDir, `${articleName}.html`);

  if (!fs.existsSync(filePath)) {
    res.status(404).send("❌ Makale bulunamadı.");
    return;
  }

  const htmlContent: string = fs.readFileSync(filePath, "utf-8");
  res.setHeader("Content-Type", "text/html");
  res.send(htmlContent);
});

// Server başlat
app.listen(PORT, () => {
  console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);

  // Server başladıktan sonra makaleleri üret
  dailyContentBlast(["Frontend Backend fullstack", "Modern web mimarisi"]);
});
