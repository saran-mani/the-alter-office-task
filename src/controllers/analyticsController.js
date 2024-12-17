import ClickAnalytics from "../models/shortenUrlClickAnalytics.js";
import shortenUrl from "../models/shortenUrlModel.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getUrlAnalytics = catchAsync(async (req, res, next) => {
  const { alias } = req.params;

  const data = await ClickAnalytics.find({ alias: alias }).select(
    "-device_info.user_agent -__v"
  );

  const shortenUrlData = await shortenUrl.findOne({ customAlias: alias });

  res.status(200).json({
    data: {
      total_clicks: shortenUrlData.numberOfClicks,
      data,
    },
  });
});
