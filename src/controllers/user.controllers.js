import { asyncHandler } from "../utils/asyncHandler.js";
import app from "../app.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { access } from "fs";

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

  console.log("Logging in: ", { email, username , password });

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

const logOutUser = asyncHandler( async (req , res) => {

  // refresh token set to null 
  // if middleware successfuly verified then we can access req.user 

  const userId = req.user._id;
  
  const user = await User.findById(userId);

  if (!user){
    throw new ApiError(404, "User not found");
  }

  user.refreshToken = "";

  await user.save({
    validateBeforeSave: false, // we dont want to run the pre middleware for hashing the password again 
  })

  // clear the cookies 

  const options = {
    httpOnly: true,
    secure: true,
  }

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));

} )

export { registerUser, logOutUser , loginUser };
