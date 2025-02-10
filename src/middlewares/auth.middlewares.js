import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header(Authentication).replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorize User");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRECT);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(400, "Invalid token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Invalid Accesstoken on catch block"
    );
  }
});
