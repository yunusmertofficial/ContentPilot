export const config = {
  COHERE_API_KEY: process.env.COHERE_API_KEY || "",
  DEVTO_API_KEY: process.env.DEVTO_API_KEY || "",
  LINKEDIN_ACCESS_TOKEN: process.env.LINKEDIN_ACCESS_TOKEN || "",
  AUTHOR_URN: process.env.AUTHOR_URN || "",
  CRON_TIMES: process.env.CRON_TIMES || "10:00,18:00", // saat:dakika formatında
};
