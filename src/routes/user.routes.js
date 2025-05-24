import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlerwares/multer.middleware.js";

const userRouter = Router();

// we can also use userRouter.get() but it doesnt support chaining
// wheareas userRouter.route() supports chaining
// if http://localhost:5000/users/ if we hit this route then this function will be called

userRouter.route("/register").post(
  upload.fields([
    { name: "avtar", maxCount: 1 },         // middleware for uploading files
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser,
);

export { userRouter };
