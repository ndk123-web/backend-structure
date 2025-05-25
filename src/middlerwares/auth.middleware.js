import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  
  const token =
    req.cookies.accessToken ||
    req.headers("authorization")?.replace("Bearer ", "");

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
    const user = await User.findById(userId).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiError(404, "Invalid Access Token");
    }

    // added extra field to the request object
    // and this will be available in the next middlewares or controllers
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, "unauthorized access");
  }
});
