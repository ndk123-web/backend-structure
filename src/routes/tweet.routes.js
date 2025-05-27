import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet
} from "../controllers/tweets.controllers.js";
import { Router } from "express";
import { verifyJWT } from "../middlerwares/auth.middleware.js";

const tweetRouter = Router();

tweetRouter.route("/create-tweet").post(verifyJWT, createTweet);

tweetRouter.route("/get-user-tweets").get(verifyJWT, getUserTweets);

tweetRouter.route("/update-tweet").patch(verifyJWT, updateTweet);

tweetRouter.route("/delete-tweet/:tweetId").delete(verifyJWT,deleteTweet);

export { tweetRouter };
