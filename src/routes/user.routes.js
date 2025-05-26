import { Router } from "express";
import {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUserDetails,
  updateAccountDetails,
  updateUserAvtar,
  updateUserCoverImage,
  getAllUsers,
  getChannelProfile
} from "../controllers/user.controllers.js";
import { upload } from "../middlerwares/multer.middleware.js";
import { verifyJWT } from "../middlerwares/auth.middleware.js";
import { verify } from "crypto";

const userRouter = Router();

// we can also use userRouter.get() but it doesnt support chaining
// wheareas userRouter.route() supports chaining
// if http://localhost:5000/users/ if we hit this route then this function will be called

// middleware for uplaoding files
// then registerUser function will be called
userRouter.route("/register").post(
  upload.fields([
    { name: "avtar", maxCount: 1 }, // middleware for uploading files
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser,
);

// no middleware for login
userRouter.route("/login").post(loginUser);

// Multer Middleware Flow:

//   1. User sends form-data with two file fields: 'avtar' and 'coverImage'.
//   2. multer.fields([...]) middleware handles incoming files.
//   3. Files are saved on disk at: /public/temp using diskStorage config.
//   4. multer creates req.files object with metadata like:
//      - fieldname, originalname, mimetype, size, path, etc.
//   5. Example: req.files.avtar[0].path gives full path to saved avatar image.
//   6. After files are saved, control goes to next handler (e.g. registerUser).
//   7. You can now access and use these file paths to upload to cloud or store in DB.
// no middleware because client will send the refresh token in the request body
userRouter.route("/refresh-token").post(refreshAccessToken);

// secured routes
userRouter.route("/logout").post(
  verifyJWT, // this middleware will verify the JWT token and add req.user to the requst object
  logOutUser,
);
userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword);
userRouter.route("/").get(verifyJWT, getCurrentUserDetails);
userRouter
  .route("/update-account-details")
  .post(verifyJWT, updateAccountDetails);

// if user verify using jwt then we can upload avtar and then updateUserAvtar Will Work
userRouter.route("/update-avtar").post(
  verifyJWT, // middleware for verifying JWT
  upload.single("avtar"), // middleware for uploading files,
  updateUserAvtar,
);

// if user verify using jwt then upload coverImage and then updateUserCoverImage will work
// 1. verifyJWT → Middleware that authenticates user and adds `req.user`.
// 2. upload.single("coverImage") → Multer middleware that:
//    - Accepts one file with field name "coverImage".
//    - Saves it to 'public/temp' (as per your multer config).
//    - Adds uploaded file details to req.file.
// 3. updateUserCoverImage →
//    - Accesses uploaded image path via req.file.path.
//    - Uploads it to Cloudinary.
//    - Updates the user's document with Cloudinary URL in DB.
//    - Returns updated user info (excluding password & refreshToken).
userRouter.route("/update-cover-image").post(
  verifyJWT,
  upload.single("coverImage"), // middleware for uploading files,
  updateUserCoverImage,
);

userRouter.route("/get-all-users").get(verifyJWT, getAllUsers);

userRouter.route("/user-profile/:username").get(
  verifyJWT,
  getChannelProfile
)

export { userRouter };
