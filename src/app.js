import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApiError } from "./utils/apiError.js";

const app = express();


// EXPRESS MIDDLEWARES

// it means for who can access our api
app.use(cors());

app.use(express.json({ limit: "20kb" }));   // accept json and limit size so it won't crash
app.use(express.urlencoded({ limit: "20kb" })); // accept urlencoded and limit size , 
app.use(express.static("public"));              // public folder where we store static files
app.use(cookieParser());                        // we can set or get cookies can access req,cookie or res.cookie

// routes 
import { userRouter } from "./routes/user.routes.js";
import { subscriptionRouter } from "./routes/subscription.routes.js";
import { tweetRouter } from "./routes/tweet.routes.js";
import { commentRouter } from "./routes/comments.routes.js";

// router declaration middlewares 
// it means any url start with /users will be handlerd by userRouter
// inside userRouter we have define all the user related routes like /register, /login etc 
// which is /users/register, /users/login etc
app.use("/api/v1/users", userRouter); // /users is the base url for all user routes
app.use("/api/v1/subscriptions", subscriptionRouter); // /subscriptions is the base url for all subscription routes
app.use("/api/v1/tweets" , tweetRouter)
app.use("/api/v1/comments",commentRouter)

app.use( ( err , req , res , next ) => {
  throw new ApiError(
    err.statusCode || 500,
    err.message || "Internal Server Error",
    err.isOperational || false
  )
} ); // Must be at the bottom of all routes and middlewares

export default app;

