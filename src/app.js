import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { UAParser } from "ua-parser-js";
import urlShortnerRoutes from "./routes/urlShortenerRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import errorController from "./controllers/errorController.js";
import rateLimit from "express-rate-limit"
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch((e) => console.log("DB Not Connected!"));

app.use(bodyParser.json());
app.use(morgan("dev"));
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 40, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply the rate limit to all requests
app.use(limiter);

const corsOptions = {
  origin: 'https://the-alter-office-frontend.netlify.app',
  methods: 'GET,POST,PUT,DELETE'
};


app.use(cors(corsOptions));
app.use(helmet());


app.use((req, res, next) => {
  const parser = new UAParser();
  const ua = parser.setUA(req.headers["user-agent"]).getResult();
  req.userAgent = ua;
  next();
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hello Alter office",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/shorten", urlShortnerRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(errorController);

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
