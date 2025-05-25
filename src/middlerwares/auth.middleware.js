import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import jwt, { decode } from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

const createNewAccessToken = async (refreshToken) => {
  // verify the refresh token
  // if error then return error or return false
  // if refresh token is valid then create new access token
  // and return it

  // verify the refresh token
  const decodedToken = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  // if error then return error or return false
  if (!decodedToken) {
    throw new ApiError(401, "Invalid Refresh Token");
  }

  const userId = decodedToken._id;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  // jwt methods are synchronous so dont need to write async / await here
  const newAccessToken = user.generateAccessToken();

  if (!newAccessToken) {
    throw new ApiError(500, "Failed to generate new access token");
  }

  // return the new access token
  return newAccessToken;
};

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // this is access token
  const token =
    req.cookies.accessToken ||
    req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized Access");
  }

  try {
    // verify the token and decode it
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken) {
      throw new ApiError(401, "Unauthorized Access");
    }

    const userId = decodedToken._id;

    // remove password and refreshToken from the user object
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(404, "Invalid Access Token");
    }

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    user.save({
      validateBeforeSave: false,
    });

    // added extra field to the request object
    // and this will be available in the next middlewares or controllers
    req.cookies.accessToken = newAccessToken;
    req.user = user;
    next();
  } catch (err) {
    // if any other error or refresh token is not present then throw unauthorized access error
    throw new ApiError(401, "Unauthorized Access or Re-login");
  }
});
