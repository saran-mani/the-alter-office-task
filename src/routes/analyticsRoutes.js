import express from "express";
import { getUrlAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/:alias", getUrlAnalytics);

export default router;
