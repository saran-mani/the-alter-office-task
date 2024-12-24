import jwt from "jsonwebtoken";
import AppError from "./appError.js";
import { catchAsync } from "./catchAsync.js";

const protectRoute = catchAsync(async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return next(new AppError("No token provided, authorization denied", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
});

export default protectRoute;
