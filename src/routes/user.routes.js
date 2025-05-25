import { Router } from "express";
import { registerUser, loginUser , logOutUser } from "../controllers/user.controllers.js";
import { upload } from "../middlerwares/multer.middleware.js";
import { verifyJWT } from "../middlerwares/auth.middleware.js";

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


// secured routes 
userRouter.route("/logout").post(
  verifyJWT,    // this middleware will verify the JWT token and add req.user to the requst object  
  logOutUser
)

export { userRouter };
