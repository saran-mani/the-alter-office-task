import mongoose from "mongoose";
const ClickAnalyticsSchema = new mongoose.Schema({
  alias: { type: String, required: true },
  click_time: { type: Date, default: Date.now },
  ip_address: { type: String },
  device_info: {
    os: String,
    browser: String,
    user_agent: String,
  },
});

const ClickAnalytics =
  mongoose.models.ClickAnalytics ||
  mongoose.model("ClickAnalytics", ClickAnalyticsSchema);

export default ClickAnalytics;
