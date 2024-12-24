import Analytics from "../models/analyticsModel.js";
import shortenUrl from "../models/urlShortenerModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import moment from "moment";

export const getUrlAnalytics = catchAsync(async (req, res, next) => {
  if (!req.user._id)
    return res.status(200).json({
      message: "please login",
    });
  const { alias } = req.params;

  const shortenUrlData = await shortenUrl.findOne({
    user: req.user._id,
    customAlias: alias,
  });

  if (!shortenUrlData) {
    return res.status(404).json({
      status: "fail",
      message: `Shortened URL with alias ${alias} not found.`,
    });
  }

  const clickData = await Analytics.find({ alias: alias }).select(
    "-device_info.user_agent -__v"
  );

  const totalClicks = shortenUrlData.numberOfClicks;

  const uniqueClicks = new Set(clickData.map((entry) => entry.ip_address)).size;

  const clicksByDate = [];
  for (let i = 6; i >= 0; i--) {
    const date = moment().subtract(i, "days").startOf("day").toDate();
    const clicksOnDate = clickData.filter((entry) =>
      moment(entry.click_time).isSame(date, "day")
    ).length;

    clicksByDate.push({
      date: moment(date).format("YYYY-MM-DD"),
      totalClicks: clicksOnDate,
    });
  }

  const osType = [];
  clickData.forEach((entry) => {
    const os = entry.device_info.os;
    const existing = osType.find((e) => e.osName === os);
    if (existing) {
      existing.uniqueClicks += 1;
      existing.uniqueUsers.add(entry.ip_address);
    } else {
      osType.push({
        osName: os,
        uniqueClicks: 1,
        uniqueUsers: new Set([entry.ip_address]),
      });
    }
  });

  const deviceType = [];
  clickData.forEach((entry) => {
    const device =
      entry.device_info.browser === "Mobile Chrome" ? "mobile" : "desktop";
    const existing = deviceType.find((e) => e.deviceName === device);
    if (existing) {
      existing.uniqueClicks += 1;
      existing.uniqueUsers.add(entry.ip_address);
    } else {
      deviceType.push({
        deviceName: device,
        uniqueClicks: 1,
        uniqueUsers: new Set([entry.ip_address]),
      });
    }
  });

  osType.forEach((entry) => (entry.uniqueUsers = entry.uniqueUsers.size));
  deviceType.forEach((entry) => (entry.uniqueUsers = entry.uniqueUsers.size));

  res.status(200).json({
    status: "success",
    data: {
      total_clicks: totalClicks,
      unique_clicks: uniqueClicks,
      clicksByDate,
      osType,
      deviceType,
    },
  });
});

export const getTopicAnalytics = catchAsync(async (req, res, next) => {
  if (!req.user._id)
    return res.status(200).json({
      message: "please login",
    });
  const { topic } = req.params;

  const shortenUrlData = await shortenUrl.find({
    user: req.user._id,
    topic: topic,
  });

  const aliases = shortenUrlData.map((entry) => entry.customAlias);

  const clickData = await Analytics.find({
    alias: { $in: aliases },
  }).select("-device_info.user_agent -__v");

  const total_clicks = shortenUrlData.reduce(
    (acc, entry) => acc + entry.numberOfClicks,
    0
  );

  const uniqueClicks = new Set(clickData.map((entry) => entry.ip_address)).size;

  const clicksByDate = [];
  for (let i = 6; i >= 0; i--) {
    const date = moment().subtract(i, "days").startOf("day").toDate();
    const clicksOnDate = clickData.filter((entry) =>
      moment(entry.click_time).isSame(date, "day")
    ).length;

    clicksByDate.push({
      date: moment(date).format("YYYY-MM-DD"),
      totalClicks: clicksOnDate,
    });
  }

  const urls = await Promise.all(
    shortenUrlData.map(async (entry) => {
      const urlClickData = clickData.filter(
        (data) => data.alias === entry.customAlias
      );

      const uniqueUrlClicks = new Set(
        urlClickData.map((entry) => entry.ip_address)
      ).size;

      return {
        shortUrl: entry.shortenUrl,
        totalClicks: entry.numberOfClicks,
        uniqueClicks: uniqueUrlClicks,
      };
    })
  );

  res.status(200).json({
    data: {
      totalClicks: total_clicks,
      uniqueClicks,
      clicksByDate,
      urls,
    },
  });
});

export const getOverallAnalytics = catchAsync(async (req, res, next) => {
  if (!req.user._id)
    return res.status(200).json({
      message: "please login",
    });
  const userUrls = await shortenUrl.find({
    user: req.user._id,
    isActive: true,
  });
  const aliass = userUrls.map((url) => url.customAlias);

  const shortUrls = userUrls.map((url) => {
    return { url: url.shortenUrl, id: url._id, alias: url.customAlias };
  });
  const totalUrls = userUrls.length;

  const clickData = await Analytics.find({ alias: { $in: aliass } });
  const totalClicks = clickData.length;

  const uniqueClicks = new Set(clickData.map((click) => click.ip_address)).size;

  const clicksByDate = clickData.reduce((acc, click) => {
    const date = moment(click.click_time).format("YYYY-MM-DD");
    if (!acc[date]) acc[date] = 0;
    acc[date]++;
    return acc;
  }, {});

  const clicksByDateArray = Object.entries(clicksByDate).map(
    ([date, count]) => ({
      date,
      totalClicks: count,
    })
  );

  const osTypeData = clickData.reduce((acc, click) => {
    const osName = click.device_info.os || "Unknown";
    if (!acc[osName])
      acc[osName] = { uniqueClicks: new Set(), uniqueUsers: new Set() };
    acc[osName].uniqueClicks.add(click.ip_address);
    acc[osName].uniqueUsers.add(click.userId);
    return acc;
  }, {});

  const osType = Object.entries(osTypeData).map(([osName, data]) => ({
    osName,
    uniqueClicks: data.uniqueClicks.size,
    uniqueUsers: data.uniqueUsers.size,
  }));

  const deviceTypeData = clickData.reduce((acc, click) => {
    const deviceName = click.device_info.browser || "Unknown";
    if (!acc[deviceName])
      acc[deviceName] = { uniqueClicks: new Set(), uniqueUsers: new Set() };
    acc[deviceName].uniqueClicks.add(click.ip_address);
    acc[deviceName].uniqueUsers.add(click.userId);
    return acc;
  }, {});

  const deviceType = Object.entries(deviceTypeData).map(
    ([deviceName, data]) => ({
      deviceName,
      uniqueClicks: data.uniqueClicks.size,
      uniqueUsers: data.uniqueUsers.size,
    })
  );

  res.status(200).json({
    status: "success",
    data: {
      totalUrls,
      totalClicks,
      uniqueClicks,
      clicksByDate: clicksByDateArray,
      osType,
      deviceType,
      shortUrls,
    },
  });
});
