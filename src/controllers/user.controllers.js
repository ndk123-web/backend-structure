import { asyncHandler } from "../utils/asyncHandler.js";
import app from "../app.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
    const existedUser = User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User or email Already Exists");
    }

    // local server stoarage path where stored in public/temp
    const avtarLocalPath = req.files?.avtar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avtarLocalPath) {
      throw new ApiError(100, "Avtar is required");
    }

    // upload to cloudinary
    if (!coverImageLocalPath) {
      const avtar = await uploadOnCloudinary(avtarLocalPath);
    } else {
      const coverImage = await uploadOnCloudinary(coverImageLocalPath);
      const avtar = await uploadOnCloudinary(avtarLocalPath);
    }

    if (!avtar) {
      throw new ApiError(500, "Error uploading avatar to cloudinary");
    }

    // database entry creation
    //
    const user = await User.create({
      fullname,
      username: username.toLowerCase(),
      email,
      password,
      avtar: avatar.url,
      coverImage: coverImage?.url || "",
    });

    // remove password from user object before sending response
    const createdUser = User.findById(user._id).select(
      "-password -refreshToke -watchHistory", // exclude password and refreshToken from response
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while creating user");
    }

    res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registerd Successfully"));
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

export { registerUser };
