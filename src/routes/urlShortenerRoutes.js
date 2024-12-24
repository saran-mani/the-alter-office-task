import express from "express";
import {
  createShortenUrl,
  getShortenUrlTopics,
  redirectShortenUrl,
} from "../controllers/urlShortnerController.js";
import protect from "../utils/protectRoute.js";

const router = express.Router();

router.post("/", protect, createShortenUrl);
router.get("/topics",protect, getShortenUrlTopics);
router.get("/:alias", redirectShortenUrl);

export default router;
