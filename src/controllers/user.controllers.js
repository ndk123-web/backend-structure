import { asyncHandler } from "../utils/asyncHandler.js";
import app from "../app.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { access } from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { subscribe } from "diagnostics_channel";
import mongoose, { mongo } from "mongoose";
import { pipeline } from "stream";

// use for generating access token
const generateAccessTokenRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    // save the user with refresh token
    // validateBeforeSave: false means that it will not run the validation before saving the user
    // like we are not running the middleware for hashing the password again
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, "Error in generating tokens");
  }
};

// register user
const registerUser = asyncHandler(async (req, res) => {
  // 1. get the data from request body
  // 2. validate the data - not empty , valid email
  // 3. check if user already exists - check using username , email
  // check for images , avtar , cover image
  // if images are present then upload them to cloudinary , avatar
  // 4. hash the password
  // 5. create user in database
  // remove password from user object before sending response
  // check for user creation
  // return res
  // 6. send respoonse back to client

  try {
    const { fullname, username, email, password } = req.body;
    console.log("Registering: ", { username, email, password });

    if (
      [fullname, username, email, password].includes("" || undefined || null)
    ) {
      throw new ApiError(400, "All fields are required");
    }

    // check if user already exists
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User or email Already Exists");
    }

    // local server stoarage path where stored in public/temp
    const avtarLocalPath = req.files?.avtar[0]?.path;
    console.log("Avtar Local Path: ", avtarLocalPath);
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (avtarLocalPath.length == 0 || !avtarLocalPath) {
      throw new ApiError(100, "Avtar is required");
    }

    // upload to cloudinary
    let avtar, coverImage;
    if (!coverImageLocalPath || coverImageLocalPath.length == 0) {
      avtar = await uploadOnCloudinary(avtarLocalPath);
    } else {
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
      avtar = await uploadOnCloudinary(avtarLocalPath);
    }

    if (!avtar || !avtar.url) {
      throw new ApiError(500, "Error uploading avtar to cloudinary");
    }

    // database entry creation
    // calls automatically the pre middleware to hash the password
    const user = await User.create({
      fullname,
      username: username.toLowerCase(),
      email,
      password,
      avtar: avtar.url,
      coverImage: coverImage?.url || "",
    });

    // remove password from user object before sending response
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -watchHistory", // exclude password and refreshToken from response
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while creating user");
    }

    // if all right then send response
    res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered Successfully"));
  } catch (error) {
    // if any error occurs then catch it and it's our error
    res.status(500).json(
      new ApiError({
        statusCode: 500,
        message: error.message || "Internal Server Error",
      }),
    );
  }
});

// login user
const loginUser = asyncHandler(async (req, res) => {
  // get the data from request body
  // validate data - not empty , valid email
  // find user in database using email
  // if user not found then return error
  // check if password is correct
  // if password is correct then create access token and refresh token
  // send cookie
  // send response to client

  const { email, password, username } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  console.log("Logging in: ", { email, username, password });

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  const { accessToken, refreshToken } = await generateAccessTokenRefreshToken(
    user._id,
  );

  // remove password and refreshToken from user object before sending response
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  // it means that only server can modify the cookie
  // httpOnly : true means that the cookie cannot be accessed by JavaScript in the browser
  const options = {
    httpOnly: true,
    secure: true,
  };

  // send response
  // we are sending cookies to the client as well as response where data is present
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "User Logged In Successfully",
      ),
    );
});

// logout user
// we just need one middleware for jwt
const logOutUser = asyncHandler(async (req, res) => {
  // refresh token set to null
  // if middleware successfuly verified then we can access req.user

  const userId = req.user._id;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.refreshToken = "";

  await user.save({
    validateBeforeSave: false, // we dont want to run the pre middleware for hashing the password again
  });

  // clear the cookies

  const options = {
    httpOnly: true,
    secure: true,
  };

  console.log("Logging out user: ", {
    email: user.email,
    username: user.username,
    fullname: user.fullname,
  });

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

// we just need one middleware for jwt
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshAccessToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh Token Not Found");
  }

  try {
    // verify the refresh token
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    if (!decodeToken) {
      throw new ApiError(401, "Invalid Refresh Token or Refresh Token Expired");
    }

    const userId = decodeToken._id;
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User Not Found for Refresh Token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Invalid Refresh Token or Refresh Token Expired");
    }

    // if all is well then generate new access token and refresh token
    const { accessToken, refreshToken } =
      await generateAccessTokenRefreshToken(userId);

    res
      .status(200)
      .cookie("accessToken", accessToken, { httpOnly: true, secure: true })
      .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true })
      .json(
        new ApiResponse(200, {
          user: user,
          accessToken,
          refreshToken,
        }),
        "User Logged In Successfully with New Access Token",
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Error in refreshing access token: " + error.message ||
        "Refresh Token Error",
    );
  }
});

// we just need one middleware for jwt
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (
    [oldPassword, newPassword, confirmPassword].some(
      (val) => !val || val.trim() === "",
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  console.log("Changing Password: ", {
    oldPassword,
    newPassword,
    confirmPassword,
  });

  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  const isOldPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isOldPasswordValid) {
    throw new ApiError(400, "Old Password is Not Matching");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New Password and Confirm Password does not match");
  }

  user.password = newPassword;

  // automatically will hash the password cause of pre middleware
  await user.save({
    validateBeforeSave: false,
  });

  console.log("New Password: ", newPassword);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        message: "Successfully changes Password",
      },
      "Password Changed Successfully",
    ),
  );
});

// we just need one middleware for jwt
const getCurrentUserDetails = asyncHandler(async (req, res) => {
  // we can access req.user
  // simply if curretUser is valid using middleware then simply send the req.user
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Found Successfully"));
});

// we just need one middleware for jwt
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, username } = req.body;

  if (!fullname || !username) {
    throw new ApiError(404, "All Fields are required");
  }

  const userId = req.user._id;

  // because we dont want to run the pre middleware for hashing the password
  const user = await User.findByIdAndUpdate(userId, {
    $set: {
      fullname: fullname,
      username: username,
    },
  }).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { user: user }), "User Updated Successfully");
});

// for this we need 2 middlewares
// first to check if user auth (jwt)
// second to upload file in server public/temp folder
const updateUserAvtar = asyncHandler(async (req, res) => {
  const avtarLocalPath = req.file?.path;

  if (!avtarLocalPath) {
    throw new ApiError(400, "Avtar is required");
  }

  const avtar = await uploadOnCloudinary(avtarLocalPath);

  if (!avtar.url) {
    throw new ApiError(400, "Something went wrong while uploading avtar");
  }

  const userId = req.user._id;
  const user = await User.findByIdAndUpdate(userId, {
    $set: {
      avtar: avtar.url,
    },
  });

  if (!user) {
    throw new ApiError(400, "User Not Found in DB for Avtar Update");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: user,
      },
      "Avtar Updated Successfully",
    ),
  );
});

// for this we need 2 middlewares
// first to check if user auth (jwt)
// second to upload file in server public/temp folder
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiResponse(400, "Please provide cover image");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiResponse(
      400,
      "Something went wrong while uploading cover image",
    );
  }

  const userId = req.user._id;
  const user = await User.findByIdAndUpdate(userId, {
    $set: {
      coverImage: coverImage.url,
    },
  }).select("-password -refreshToken");

  res
    .status(200)
    .json(
      new ApiResponse(200, { user: user }, "Cover Image Updated Successfully"),
    );
});

// 1 middleware required
const getAllUsers = asyncHandler(async (req, res) => {
  // from middleware
  const userId = req.user._id;
  const users = await User.find().select("-password -refreshToken");

  if (!users) {
    throw new ApiError(400, "There is No User");
  }

  res.status(200).json(
    new ApiResponse(
      201,
      {
        user: users,
      },
      "Successfully gets all users",
    ),
  );
});

const getChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "Username Missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions", // collection name should be lowercase
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        email: 1,
        coverImage: 1
      }
    }
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res.status(200).json(
    new ApiResponse(200, channel[0], "Channel fetched successfully")
  );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id), // Fix: Schema.Types to Types
      },
    },
    {
      $lookup: {
        from: "videos", // collection name should be lowercase
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users", // collection name should be lowercase
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user?.length) {
    throw new ApiError(404, "User history not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { watchHistory: user[0]?.watchHistory || [] },
      "Watch history fetched successfully",
    ),
  );
});

export {
  registerUser,
  logOutUser,
  loginUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUserDetails,
  updateAccountDetails,
  updateUserAvtar,
  updateUserCoverImage,
  getAllUsers,
  getChannelProfile,
  getWatchHistory
};
