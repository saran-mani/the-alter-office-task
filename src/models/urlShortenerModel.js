import mongoose from "mongoose";

const shortenUrlSchema = new mongoose.Schema(
  {
    longUrl: {
      type: String,
      required: true,
    },
    shortenUrl: {
      type: String,
      unique: true,
    },
    customAlias: {
      type: String,
    },
    topic: {
      type: String,
    },
    numberOfClicks: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const shortenUrl =
  mongoose.models.shortenUrl || mongoose.model("shortenUrl", shortenUrlSchema);

export default shortenUrl;
