import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import jwt, { decode } from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";



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

    console.log("New Access Token and Refresh Token Generated: ", { newAccessToken , newRefreshToken })

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
