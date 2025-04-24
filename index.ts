import dotenv from "dotenv";
dotenv.config();
import { dailyContentBlast } from "./services/scheduler";

dailyContentBlast(["Frontend Backend fullstack", "Modern web mimarisi"]);
