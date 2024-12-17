import express from "express";
import { createShortenUrl, redirectShortenUrl } from "../controllers/shortenUrlController.js";

const router = express.Router();

router.post("/", createShortenUrl);
router.get("/:alias", redirectShortenUrl);

export default router;
