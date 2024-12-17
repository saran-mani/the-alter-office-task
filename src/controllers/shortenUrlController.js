import { validationResult, matchedData } from "express-validator";
import { nanoid } from "nanoid";
import AppError from "../utils/appError.js";
import shortenUrl from "../models/shortenUrlModel.js"; // Import your model
import { catchAsync } from "../utils/catchAsync.js";
import { createShortenUrlValidator } from "../validator/create.shorten.url.validator.js";
import ClickAnalytics from "../models/shortenUrlClickAnalytics.js";

export const createShortenUrl = catchAsync(async (req, res, next) => {
  await Promise.all(
    createShortenUrlValidator.map((validator) => validator.run(req))
  );

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(`${errors.array().at(0)?.msg}`, 400));
  }

  const { longUrl, customAlias, topic } = matchedData(req);

  let alias = "";

  if (customAlias) {
    const existingShortenUrl = await shortenUrl.findOne({
      customAlias: customAlias,
      isActive: true,
    });
    if (existingShortenUrl) {
      return next(
        new AppError(
          "Custom alias already exists. Please use a different one.",
          400
        )
      );
    }
    alias = customAlias;
  } else {
    alias = nanoid(7);
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const generateShortenUrl = `${baseUrl}/${alias}`;
  const ShortenedUrlData = await shortenUrl.create({
    longUrl: longUrl,
    shortenUrl: generateShortenUrl,
    customAlias: customAlias || alias,
    topic: topic || "general",
    isActive: true,
  });

  res.status(201).json({
    status: "success",
    data: {
      shortUrl: ShortenedUrlData.shortenUrl,
      createdAt: ShortenedUrlData.createdAt,
    },
  });
});

export const redirectShortenUrl = catchAsync(async (req, res, next) => {
  const { alias } = req.params;
  // // 1. Collect device and click info
  const deviceInfo = {
    os: req.userAgent.os.name || "Unknown OS",
    browser: req.userAgent.browser.name || "Unknown Browser",
    user_agent: req.headers["user-agent"],
  };
  console.log(deviceInfo);
  // // 2. Store click analytics in MongoDB
  await ClickAnalytics.create({
    alias: alias,
    ip_address: req.ip || "Unknown IP",
    device_info: deviceInfo,
  });

  // 3. Find the shortened URL based on the alias
  const shortendUrl = await shortenUrl
    .findOne({ customAlias: alias })
    .select("longUrl numberOfClicks");
  // 4. If the alias is not found, return 404
  if (shortendUrl) {
    shortendUrl.numberOfClicks = (shortendUrl.numberOfClicks || 0) + 1; // Handle undefined clicks
    console.log(shortendUrl.numberOfClicks)
    await shortendUrl.save();
  } else {
    return res.status(404).json({
      status: "fail",
      message: "URL not found",
    });
  }

  // 5. Redirect to the original long URL
  res.redirect(shortendUrl.longUrl);
});
