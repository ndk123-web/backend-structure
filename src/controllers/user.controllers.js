import { asyncHandler } from "../utils/asyncHandler.js";
import app from "../app.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
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
    // calls automatically the pre middleware
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
  } 
  
  // if any error occurs then catch it and it's our error
  catch (error) {
    res.status(500).json(
      new ApiError({
        statusCode: 500,
        message: error.message || "Internal Server Error",
      }),
    );
  }
});

export { registerUser };
