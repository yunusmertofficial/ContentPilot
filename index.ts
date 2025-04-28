import dotenv from "dotenv";
dotenv.config();
import { dailyContentBlast } from "./services/scheduler";

const competencies = [
  "Frontend Development (React, Angular, React Native,Next.js)",
  "Backend Development (Node.js)",
  "Fullstack Development",
  "Microservices",
  "Web Architecture",
  "Cloud Services (AWS, Azure)",
  "Prisma, MongoDB, PostgreSQL",
];

dailyContentBlast(
  ["Frontend Backend fullstack", "Modern web mimarisi"],
  competencies
);
