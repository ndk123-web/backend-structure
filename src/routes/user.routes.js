import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";

const userRouter = Router();

// we can also use userRouter.get() but it doesnt support chaining
// wheareas userRouter.route() supports chaining
// if http://localhost:5000/users/ if we hit this route then this function will be called
userRouter.route("/register").post(registerUser);

export { userRouter };
