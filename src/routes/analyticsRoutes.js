import express from "express";
import {
  getOverallAnalytics,
  getTopicAnalytics,
  getUrlAnalytics,
} from "../controllers/analyticsController.js";
import protect from "../utils/protectRoute.js";

const router = express.Router();
router.use(protect);
router.get("/overall", getOverallAnalytics);
router.get("/:alias", getUrlAnalytics);
router.get("/topic/:topic", getTopicAnalytics);

export default router;
