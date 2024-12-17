import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { UAParser } from "ua-parser-js";
import shortenUrlRoutes from "../src/routes/shortenUrlRoutes.js";
import shortenUrlAnalyticsRoutes from "../src/routes/analyticsRoutes.js";
import errorController from "./controllers/errorController.js";
import { redirectShortenUrl } from "./controllers/shortenUrlController.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch((e) => console.log("DB Not Connected!"));

app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors());
app.use(helmet());

app.set("trust proxy", true);

// User Agent parsing middleware
app.use((req, res, next) => {
  const parser = new UAParser();
  const ua = parser.setUA(req.headers["user-agent"]).getResult();
  req.userAgent = ua;
  next();
});
app.set('veiw engine', 'ejs')


app.use("/api/shorten", shortenUrlRoutes);
app.use("/api/analytics", shortenUrlAnalyticsRoutes);
app.get("/:alias", redirectShortenUrl);

// Error handling middleware
app.use(errorController);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});
