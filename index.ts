import dotenv from "dotenv";
dotenv.config();
import cron from "node-cron";
import { config } from "./config";
import { dailyContentBlast } from "./services/scheduler";

const times = config.CRON_TIMES.split(",").map((t) => t.trim());
const TIMEZONE = "Europe/Istanbul";
times.forEach((time) => {
  const [hour, minute] = time.split(":").map(Number);

  if (isNaN(hour) || isNaN(minute)) {
    console.warn(`⛔ Geçersiz cron saati: ${time}`);
    return;
  }

  const cronExp = `${minute} ${hour} * * *`; // dakika saat * * *
  cron.schedule(
    cronExp,
    () => {
      console.log(`⏰ [${TIMEZONE}] ${time} - Görev tetiklendi.`);
      dailyContentBlast(["Frontend Backend fullstack", "Modern web mimarisi"]);
    },
    {
      timezone: TIMEZONE,
    }
  );
});
