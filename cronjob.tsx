import cron from "node-cron";
import { config } from "./config";
import { dailyContentBlast } from "./services/scheduler";

const TIMEZONE = "Europe/Istanbul";

function startScheduledJobs() {
  const times = config.CRON_TIMES.split(",").map((t) => t.trim());

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
        dailyContentBlast([
          "Frontend Backend fullstack",
          "Modern web mimarisi",
        ]);
      },
      {
        timezone: TIMEZONE,
      }
    );

    console.log(`✅ Cron job ayarlandı: ${time} (${cronExp})`);
  });
}

startScheduledJobs();
