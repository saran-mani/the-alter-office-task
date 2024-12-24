import { validationResult, matchedData } from "express-validator";
import { nanoid } from "nanoid";
import AppError from "../utils/appError.js";
import shortenUrl from "../models/urlShortenerModel.js"; // Import your model
import { catchAsync } from "../utils/catchAsync.js";
import { createShortenUrlValidator } from "../validator/create.shorten.url.validator.js";
import Analytics from "../models/analyticsModel.js";
import redisClient from "../redisClient.js";

export const createShortenUrl = catchAsync(async (req, res, next) => {
  if (!req.user._id)
    return res.status(200).json({
      message: "please login",
    });
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

  const baseUrl = `${req.protocol}://${req.get("host")}/api/shorten`;

  const generateShortenUrl = `${baseUrl}/${alias}`;
  const ShortenedUrlData = await shortenUrl.create({
    longUrl: longUrl,
    shortenUrl: generateShortenUrl,
    customAlias: customAlias || alias,
    topic: topic || "general",
    isActive: true,
    user: req.user._id,
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

  const deviceInfo = {
    os: req.userAgent.os.name || "Unknown OS",
    browser: req.userAgent.browser.name || "Unknown Browser",
    user_agent: req.headers["user-agent"],
  };

  console.log(deviceInfo);

  redisClient.get(alias, async (err, cachedLongUrl) => {
    if (err) return next(err);

    if (cachedLongUrl) {
      await Analytics.create({
        alias: alias,
        ip_address: req.ip || "Unknown IP",
        device_info: deviceInfo,
      });
      return res.redirect(cachedLongUrl);
    }

    const shortendUrl = await shortenUrl
      .findOne({ customAlias: alias })
      .select("longUrl numberOfClicks");

    if (!shortendUrl) {
      return res.status(404).json({
        status: "fail",
        message: "URL not found",
      });
    }

    shortendUrl.numberOfClicks = (shortendUrl.numberOfClicks || 0) + 1;
    await shortendUrl.save();

    redisClient.set(alias, shortendUrl.longUrl, "EX", 3600);

    await Analytics.create({
      alias: alias,
      ip_address: req.ip || "Unknown IP",
      device_info: deviceInfo,
    });

    res.redirect(shortendUrl.longUrl);
  });
});

export const getShortenUrlTopics = catchAsync(async (req, res, next) => {
  if (!req.user._id)
    return res.status(200).json({
      message: "please login",
    });

  // Fetch the topics from the database
  const topics = await shortenUrl.find({ user: req.user._id }, { topic: 1 });

  // Remove duplicate topics
  const uniqueTopics = [
    ...new Map(topics.map(item => [item.topic, item])).values()
  ];

  res.status(200).json({
    status: "success",
    data: uniqueTopics
  });
});

