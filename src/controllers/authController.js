import User from "../models/userModel.js";
import axios from "axios";
import jwt from "jsonwebtoken";
import oauth2client from "../utils/googleConfig.js";
import { catchAsync } from "../utils/catchAsync.js";

export const googleLogin = catchAsync(async (req, res) => {
  const { code } = req.query;

  const googleRes = await oauth2client.getToken(code);
  oauth2client.setCredentials(googleRes.tokens);

  const userRes = await axios.get(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
  );

  const { email, name, picture } = userRes.data;

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      name,
      profilePicture: picture,
    });
  }

  const { _id } = user;
  const token = jwt.sign({ _id, email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return res.status(200).json({
    message: "success",
    token,
    user,
  });
});
