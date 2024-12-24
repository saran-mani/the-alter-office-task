import mongoose from "mongoose";
const AnalyticsSchema = new mongoose.Schema({
  alias: { type: String, required: true },
  click_time: { type: Date, default: Date.now },
  ip_address: { type: String },
  device_info: {
    os: String,
    browser: String,
    user_agent: String,
  },
});

const Analytics =
  mongoose.models.Analytics || mongoose.model("Analytics", AnalyticsSchema);

export default Analytics;
